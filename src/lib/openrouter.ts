import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';


export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-for-build',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'MeetingMind v2.0',
  },
});


export const MODELS = {
  ANALYSIS: 'arcee-ai/trinity-large-preview:free',
  QUERY: 'arcee-ai/trinity-large-preview:free',
  FLASHCARD: 'arcee-ai/trinity-large-preview:free',
  COMPARISON: 'arcee-ai/trinity-large-preview:free',
} as const;


export const ANALYSIS_SYSTEM_PROMPT = `You are an expert meeting analyst and executive assistant. Analyze the provided meeting transcript and extract structured information.

Return ONLY a JSON object with this exact structure:
{
  "summary": "string - comprehensive 2-3 paragraph summary",
  "decisions": [
    {
      "id": "unique-id",
      "text": "decision description",
      "owner": "person responsible (extract from context or null)",
      "confidence": 0.0-1.0,
      "timestamp": seconds from start (estimate based on transcript position),
      "context": "surrounding discussion context"
    }
  ],
  "actionItems": [
    {
      "id": "unique-id",
      "text": "action description",
      "assignee": "person assigned (null if unclear)",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "low|medium|high|urgent",
      "completed": false,
      "context": "extraction context"
    }
  ],
  "topics": [
    {
      "name": "topic name",
      "relevance": 0.0-1.0,
      "occurrences": [{"start": seconds, "end": seconds, "text": "relevant excerpt"}]
    }
  ],
  "nextSteps": [
    {
      "text": "next step description",
      "priority": "low|medium|high|urgent",
      "timeframe": "immediate|short_term|medium_term|long_term",
      "assignee": "person or null",
      "dependencies": []
    }
  ],
  "risks": [
    {
      "level": "low|medium|high",
      "description": "risk description",
      "mitigation": "suggested mitigation or null",
      "probability": 0.0-1.0,
      "impact": "low|medium|high",
      "relatedDecisions": []
    }
  ],
  "sentiment": {
    "overall": "positive|neutral|negative",
    "score": -1.0 to 1.0,
    "timeline": [
      {"timestamp": seconds, "sentiment": "positive|neutral|negative", "score": -1.0 to 1.0, "text": "excerpt"}
    ],
    "speakers": {}
  },
  "keyMoments": [
    {
      "type": "decision|action_item|insight|concern|agreement|disagreement",
      "timestamp": seconds,
      "description": "moment description",
      "importance": 1-5,
      "speakers": ["speaker names"],
      "relatedTopics": []
    }
  ]
}

Guidelines:
- Extract explicit decisions and commitments, not suggestions
- Identify action items with clear owners and deadlines
- Categorize topics by relevance to meeting objectives
- Flag risks with specific probability and impact assessments
- Track sentiment changes throughout the meeting
- Highlight moments of agreement, disagreement, or insight
- Use ISO 8601 dates (YYYY-MM-DD) for due dates
- Generate unique IDs using descriptive slugs (e.g., "decision-ai-roadmap")`;


export const QUERY_SYSTEM_PROMPT = `You are an intelligent meeting assistant. Answer user queries about meetings by selecting the most relevant UI components to display.

Available components (use 1-4 per response based on query complexity):

CORE ANALYSIS:
- "meeting_summary": Overall summary with key metrics. USE FOR: overview, "what happened", "summarize"
- "decision_tracker": Decision list with owners and confidence. USE FOR: "decisions made", "what did we decide"
- "action_item_list": Tasks with checkboxes and priority badges. USE FOR: "action items", "todos", "tasks"
- "topic_explorer": Topic cards with relevance and occurrences. USE FOR: "topics discussed", "what did we talk about"
- "speaker_analytics": Speaking time distribution bar chart. USE FOR: "who spoke most", "participation"

VISUALIZATIONS:
- "timeline_view": Vertical timeline of meeting events. USE FOR: "chronology", "timeline", "flow"
- "kanban_board": 3-column status board (todo/progress/done). USE FOR: "status", "progress", "kanban"
- "network_graph": Speaker interaction visualization. USE FOR: "interactions", "relationships", "who talked to whom"
- "heat_map": Activity intensity by time/topic. USE FOR: "activity", "intensity", "hot spots"
- "sentiment_timeline": Sentiment score over time line chart. USE FOR: "mood", "sentiment", "tone"

COMPARISON & ANALYSIS:
- "comparison_matrix": Side-by-side meeting comparison. USE FOR: "compare", "versus", "differences"
- "priority_matrix": Eisenhower 2x2 grid (urgent/important). USE FOR: "priorities", "urgent vs important"
- "conflict_detector": Disagreements and concerns list. USE FOR: "disagreements", "concerns", "conflicts"
- "quick_stats": Metric cards grid (duration, speakers, decisions). USE FOR: "statistics", "numbers", "metrics"
- "person_view": Individual participant focus. USE FOR: "what did [person] say", "focus on [person]"

ADVANCED:
- "video_timeline_view": Video player with chapter navigation. USE FOR: video meetings, "show video", "playback"
- "meeting_comparator": Multi-meeting trend analysis. USE FOR: "trends over time", "pattern across meetings"
- "risk_predictor": Risk cards with severity coloring. USE FOR: "risks", "what could go wrong", "concerns"
- "deadline_forecast": Deadline urgency categories. USE FOR: "deadlines", "when are things due", "urgent dates"
- "trend_analyzer": Multi-meeting line chart with insights. USE FOR: "how are we trending", "progress over time"

PRODUCTIVITY:
- "todo_dashboard": Task overview with filters. USE FOR: "my tasks", "what should I do"
- "kanban_board_enhanced": Drag-drop task management. USE FOR: "organize tasks", "task board"
- "gtd_inbox": Process action items into organized tasks. USE FOR: "process inbox", "GTD"
- "eisenhower_matrix": Priority quadrant visualization. USE FOR: "prioritize", "what's important"
- "time_blocking_calendar": Schedule tasks into calendar. USE FOR: "schedule", "calendar", "when to do"
- "dependency_graph": Task dependency network. USE FOR: "dependencies", "what blocks what"
- "productivity_insights": Analytics on task completion. USE FOR: "productivity", "how am I doing"

LEARNING:
- "flashcard_generator": AUTO-GENERATES flashcards from meeting content. USE FOR: "create flashcards", "study material", "learning", "review". Automatically extracts key concepts, decisions, and insights from the transcript and creates question-answer pairs.
- "flashcard_reviewer": Main review interface with flip. USE FOR: "review cards", "study"
- "study_dashboard": Study stats, decks, calendar heatmap. USE FOR: "study progress", "learning stats"
- "deck_manager": Organize flashcards into decks. USE FOR: "organize decks", "manage cards"
- "flashcard_editor": Create/edit cards with all types. USE FOR: "edit card", "new card"
- "learning_insights": Analytics on learning patterns. USE FOR: "learning analytics", "retention"

Response format:
{
  "answer": "Direct answer to the query (2-4 sentences)",
  "components": [
    {
      "type": "component_id",
      "data": { /* component-specific data structure - see below */ },
      "priority": "high|medium|low",
      "layout": "full|half|third|card"
    }
  ],
  "suggestedFollowUps": ["3 related questions"],
  "confidence": 0.0-1.0
}

IMPORTANT SELECTION RULES:
- Use 1 component for simple factual queries
- Use 2-3 for analytical queries
- Use 3-4 for complex strategic queries
- Always include at least one visual component for data-heavy queries
- Prioritize components that show relationships for "how" and "why" questions
- Include action-oriented components for "what should I do" questions
- Match component priority to query urgency (urgent queries get high-priority components)
- DO NOT include quick_stats unless the user explicitly asks for statistics, numbers, or metrics
- Avoid showing the same type of component repeatedly - each response should be fresh and relevant

meeting_summary: {
  "summary": "string - executive summary",
  "keyPoints": ["string array of key points"],
  "duration": number,
  "participantCount": number,
  "decisionCount": number,
  "actionItemCount": number,
  "sentiment": "positive|neutral|negative",
  "meetingDate": "ISO date string"
}

decision_tracker: {
  "decisions": [
    {
      "id": "string",
      "text": "decision description",
      "owner": "person name or null",
      "confidence": 0.0-1.0,
      "timestamp": "ISO date string",
      "context": "discussion context"
    }
  ]
}

action_item_list: {
  "items": [
    {
      "id": "string",
      "text": "task description",
      "assignee": "person name or null",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "low|medium|high|urgent",
      "completed": boolean,
      "meetingId": "string"
    }
  ],
  "filters": { "status": "all", "priority": null, "assignee": null }
}

topic_explorer: {
  "topics": [
    {
      "name": "topic name",
      "relevance": 0.0-1.0,
      "occurrences": number,
      "sentiment": "positive|neutral|negative",
      "relatedTopics": ["related topic names"]
    }
  ],
  "totalTopics": number,
  "dominantTopic": "most discussed topic"
}

speaker_analytics: {
  "speakers": [
    {
      "name": "speaker name",
      "speakingTime": seconds,
      "percentage": 0.0-100.0,
      "segments": number,
      "sentiment": "positive|neutral|negative",
      "interventions": number
    }
  ],
  "totalSpeakingTime": seconds,
  "mostActiveSpeaker": "name"
}

sentiment_timeline: {
  "timeline": [
    {
      "timestamp": seconds_from_start,
      "sentiment": "positive|neutral|negative",
      "score": -1.0_to_1.0,
      "text": "excerpt",
      "speaker": "name"
    }
  ],
  "overall": "positive|neutral|negative",
  "averageScore": -1.0_to_1.0
}

quick_stats: {
  "duration": seconds,
  "participantCount": number,
  "decisionCount": number,
  "actionItemCount": number,
  "topicCount": number,
  "avgSentiment": -1.0_to_1.0
}

priority_matrix: {
  "quadrants": {
    "q1": [{"id": "string", "text": "urgent & important", "priority": "high", "urgency": 0.0-1.0, "importance": 0.0-1.0}],
    "q2": [{"id": "string", "text": "not urgent & important", "priority": "medium", "urgency": 0.0-1.0, "importance": 0.0-1.0}],
    "q3": [{"id": "string", "text": "urgent but not important", "priority": "low", "urgency": 0.0-1.0, "importance": 0.0-1.0}],
    "q4": [{"id": "string", "text": "neither urgent nor important", "priority": "lowest", "urgency": 0.0-1.0, "importance": 0.0-1.0}]
  }
}

flashcard_generator: {
  "suggestedCards": [
    {
      "id": "unique-id",
      "question": "Question based on meeting content",
      "answer": "Answer extracted from transcript",
      "context": "Optional context from the meeting",
      "difficulty": "easy|medium|hard",
      "tags": ["topic1", "topic2"],
      "sourceMeeting": "meeting title"
    }
  ]
}

Selection rules:
- Use 1 component for simple factual queries
- Use 2-3 for analytical queries
- Use 3-4 for complex strategic queries
- Always include at least one visual component for data-heavy queries
- Prioritize components that show relationships for "how" and "why" questions
- Include action-oriented components for "what should I do" questions
- Match component priority to query urgency (urgent queries get high-priority components)`;


export const COMPARISON_SYSTEM_PROMPT = `You are a strategic analyst identifying patterns across multiple meetings.

Analyze the provided meeting summaries and identify:

1. PATTERNS: Recurring themes, decisions, or concerns across meetings
2. TRENDS: Changes over time in sentiment, productivity, or focus areas
3. INSIGHTS: Non-obvious connections or recommendations

Return JSON:
{
  "patterns": [
    {
      "type": "topic|decision|sentiment|action",
      "description": "Pattern description",
      "occurrences": [
        {
          "meetingId": "id",
          "timestamp": "ISO date",
          "context": "Specific mention"
        }
      ]
    }
  ],
  "trends": {
    "sentiment": [{ "date": "ISO", "score": -1.0 to 1.0 }],
    "productivity": [{ "date": "ISO", "actionItemsCompleted": number }],
    "topicEvolution": [
      {
        "topic": "name",
        "timeline": [{ "date": "ISO", "relevance": 0.0-1.0 }]
      }
    ]
  },
  "insights": ["Strategic insight 1", "Insight 2", "Recommendation"]
}

Focus on actionable intelligence that helps the team improve over time.`;


export async function chatCompletion(
  messages: ChatCompletionMessageParam[],
  model: string = MODELS.QUERY,
  temperature: number = 0.3,
  maxTokens: number = 4000
): Promise<string> {
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    return content;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function analyzeMeetingWithOpenRouter(
  transcript: string,
  speakers?: { name: string; speakingTime: number }[]
): Promise<{
  summary: string;
  decisions: any[];
  actionItems: any[];
  topics: any[];
  nextSteps: any[];
  risks: any[];
  sentiment: any;
  keyMoments: any[];
}> {
  try {
    let context = `Transcript:\n${transcript}`;
    
    if (speakers && speakers.length > 0) {
      context += `\n\nSpeakers:\n${speakers.map(s => `- ${s.name} (${Math.round(s.speakingTime)}s)`).join('\n')}`;
    }

    const response = await chatCompletion(
      [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      MODELS.ANALYSIS,
      0.3,
      4000
    );

    const analysis = JSON.parse(response);

    return {
      summary: analysis.summary || 'No summary available',
      decisions: Array.isArray(analysis.decisions) ? analysis.decisions : [],
      actionItems: Array.isArray(analysis.actionItems) ? analysis.actionItems : [],
      topics: Array.isArray(analysis.topics) ? analysis.topics : [],
      nextSteps: Array.isArray(analysis.nextSteps) ? analysis.nextSteps : [],
      risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      sentiment: analysis.sentiment || { overall: 'neutral', score: 0, timeline: [] },
      keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments : [],
    };

  } catch (error) {
    console.error('OpenRouter analysis error:', error);
    
    return {
      summary: 'Error analyzing meeting. Please try again.',
      decisions: [],
      actionItems: [],
      topics: [],
      nextSteps: [],
      risks: [],
      sentiment: { overall: 'neutral', score: 0, timeline: [] },
      keyMoments: [],
    };
  }
}


export async function answerQueryWithOpenRouter(
  meeting: any,
  query: string,
  includedMeetings?: any[]
): Promise<any> {
  try {
    let context = `Meeting: ${meeting.title}\n`;
    context += `Date: ${meeting.createdAt}\n`;
    context += `Duration: ${meeting.duration ? Math.round(meeting.duration / 60) + ' minutes' : 'Unknown'}\n\n`;
    
    if (meeting.summary) {
      context += `Summary: ${meeting.summary}\n\n`;
    }
    
    if (meeting.transcript) {
      const maxLen = 50000;
      const transcript = meeting.transcript.length > maxLen * 2
        ? meeting.transcript.substring(0, maxLen) + '\n...[truncated]...\n' + meeting.transcript.substring(meeting.transcript.length - maxLen)
        : meeting.transcript;
      context += `Transcript:\n${transcript}\n\n`;
    }

    if (meeting.decisions?.length) {
      context += `Decisions:\n${meeting.decisions.map((d: any) => `- ${d.text}`).join('\n')}\n\n`;
    }

    if (meeting.actionItems?.length) {
      context += `Action Items:\n${meeting.actionItems.map((a: any) => `- [${a.completed ? 'x' : ' '}] ${a.text}`).join('\n')}\n\n`;
    }

    if (includedMeetings?.length) {
      context += `Related Meetings:\n${includedMeetings.map(m => `- ${m.title} (${m.createdAt}): ${m.summary?.substring(0, 200)}...`).join('\n')}\n\n`;
    }

    const response = await chatCompletion(
      [
        { role: 'system', content: QUERY_SYSTEM_PROMPT },
        { role: 'user', content: `Query: ${query}\n\nContext:\n${context}` },
      ],
      MODELS.QUERY,
      0.3,
      4000
    );

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response preview:', response.substring(0, 500) + '...');
      
      
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch (fallbackError) {
          console.error('Fallback JSON parse failed:', fallbackError);
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }

    const components = (parsed.components || []).map((comp: any) => ({
      type: comp.type,
      data: comp.data,
      priority: comp.priority || 'medium',
      layout: comp.layout || 'full',
      title: comp.title,
      description: comp.description,
    }));

    return {
      answer: parsed.answer || 'I analyzed the meeting for you.',
      components,
      suggestedFollowUps: parsed.suggestedFollowUps || [],
      confidence: parsed.confidence || 0.8,
    };

  } catch (error) {
    console.error('OpenRouter query error:', error);
    
    return {
      answer: 'I encountered an error processing your query. Here is a basic summary instead.',
      components: [{
        type: 'meeting_summary',
        data: { summary: meeting.summary || 'No summary available' },
        priority: 'high',
        layout: 'full',
      }],
      suggestedFollowUps: [],
      confidence: 0.5,
    };
  }
}