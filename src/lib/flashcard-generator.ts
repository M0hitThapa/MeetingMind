import { chatCompletion, MODELS } from './openrouter';
import type { Meeting, Flashcard, CardType } from '@/types';

const FLASHCARD_GENERATION_PROMPT = `You are an expert educational content creator. Generate flashcards from meeting content to help with learning and retention.

Create 10-20 flashcards covering:
- Key decisions and their rationale
- Important concepts discussed
- Action items and their context
- Technical terms or jargon explained
- Process changes or new procedures

Use varied card types:
- "basic": Simple Q&A
- "cloze": Fill-in-the-blank (use {{c1::hidden text}} syntax)
- "multiple_choice": 4 options with 1 correct
- "definition": Term and definition
- "concept": Big idea with explanation and example

Return JSON array:
[
  {
    "cardType": "basic|cloze|multiple_choice|definition|concept",
    "question": "Question text",
    "answer": "Answer text",
    "context": "Source context from meeting (optional)",
    "options": ["opt1", "opt2", "opt3", "opt4"], // for multiple_choice
    "correctOption": 0, // index for multiple_choice
    "clozeText": "Text with {{c1::hidden}} parts", // for cloze
    "category": "category name",
    "tags": ["tag1", "tag2"],
    "importance": 1-5,
    "difficulty": 1-5
  }
]

Guidelines:
- Extract specific facts, not generic advice
- Make questions precise and unambiguous
- Include meeting context in answers for reference
- Vary difficulty (1=easy, 5=hard)
- Tag with relevant topics for organization
- Ensure cloze deletions test key concepts, not trivial words`;


export async function generateFlashcardsFromMeeting(meeting: Meeting): Promise<Omit<Flashcard, 'id' | 'meetingId' | 'deckId' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'lastReviewed' | 'timesReviewed' | 'timesCorrect' | 'averageTime' | 'meeting' | 'deck' | 'reviews'>[]> {
  try {
    const context = `
Meeting: ${meeting.title}
Summary: ${meeting.summary || 'No summary'}
Key Decisions: ${JSON.stringify(meeting.decisions || [])}
Topics: ${JSON.stringify(meeting.topics?.map((t: any) => t.name) || [])}
Transcript Excerpt: ${meeting.transcript?.substring(0, 10000) || 'No transcript'}
`;

    const messages = [
      { role: 'system' as const, content: FLASHCARD_GENERATION_PROMPT },
      { role: 'user' as const, content: context },
    ];

    const response = await chatCompletion(messages, MODELS.FLASHCARD, 0.5, 4000);
    const cards = JSON.parse(response);

    
    return cards.map((card: any, index: number) => ({
      cardType: (card.cardType as CardType) || 'basic',
      question: card.question || `Question ${index + 1}`,
      answer: card.answer || 'No answer provided',
      context: card.context || meeting.summary || '',
      options: card.options || [],
      correctOption: card.correctOption,
      clozeText: card.clozeText,
      category: card.category || 'General',
      tags: card.tags || [],
      importance: Math.min(5, Math.max(1, card.importance || 3)),
      difficulty: Math.min(5, Math.max(1, card.difficulty || 3)),
    }));

  } catch (error) {
    console.error('Flashcard generation error:', error);
    
    
    return [
      {
        cardType: 'basic',
        question: `What was the main topic of "${meeting.title}"?`,
        answer: meeting.summary || 'Review the meeting summary',
        context: meeting.summary || '',
        options: [],
        category: 'General',
        tags: ['meeting', 'summary'],
        importance: 5,
        difficulty: 3,
      },
    ];
  }
}