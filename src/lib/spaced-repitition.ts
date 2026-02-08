import type { Flashcard } from '@/types';



interface SM2Result {
  nextReview: string;
  newInterval: number;
  newEaseFactor: number;
}


export function calculateNextReview(
  flashcard: Pick<Flashcard, 'easeFactor' | 'interval' | 'repetitions'>,
  rating: number
): SM2Result {
  
  const q = Math.max(0, Math.min(5, rating));
  
  let newRepetitions = flashcard.repetitions;
  let newInterval: number;
  let newEaseFactor = flashcard.easeFactor;

  if (q < 3) {
    
    newRepetitions = 0;
    newInterval = 1;
  } else {
    
    newRepetitions = flashcard.repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(flashcard.interval * flashcard.easeFactor);
    }
  }

  
  newEaseFactor = flashcard.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  
  newEaseFactor = Math.max(1.3, newEaseFactor);

  
  newInterval = Math.min(365, newInterval);

  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    nextReview: nextReview.toISOString(),
    newInterval,
    newEaseFactor: Math.round(newEaseFactor * 100) / 100, 
  };
}


export async function getDueCards(
  getCards: () => Promise<Flashcard[]>,
  deckId?: string,
  limit: number = 20
): Promise<Flashcard[]> {
  const now = new Date().toISOString();
  const cards = await getCards();
  
  return cards
    .filter(card => 
      card.nextReview <= now && 
      (!deckId || card.deckId === deckId)
    )
    .sort((a, b) => {
      
      if (a.nextReview !== b.nextReview) {
        return a.nextReview.localeCompare(b.nextReview);
      }
      return b.difficulty - a.difficulty;
    })
    .slice(0, limit);
}


export function calculateStudySchedule(cards: Flashcard[]): Array<{ date: string; count: number; newCards: number; reviews: number }> {
  const schedule: Array<{ date: string; count: number; newCards: number; reviews: number }> = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dueCards = cards.filter(card => {
      const cardDate = card.nextReview.split('T')[0];
      return cardDate === dateStr;
    });
    
    const newCards = dueCards.filter(c => c.repetitions === 0).length;
    const reviews = dueCards.filter(c => c.repetitions > 0).length;
    
    schedule.push({
      date: dateStr,
      count: dueCards.length,
      newCards,
      reviews,
    });
  }
  
  return schedule;
}


export function estimateRetention(flashcard: Flashcard): number {
  if (!flashcard.lastReviewed) {
    return 0; 
  }
  
  const daysSinceReview = (Date.now() - new Date(flashcard.lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
  
  
  const stability = flashcard.interval * flashcard.easeFactor;
  const retention = Math.exp(-daysSinceReview / stability);
  
  return Math.round(retention * 100) / 100;
}


export function calculateMasteryStats(cards: Flashcard[]): {
  matureCards: number;
  totalCards: number;
  masteryPercentage: number;
  averageTimeToMastery: number | null;
} {
  const matureCards = cards.filter(c => c.interval > 21).length;
  const totalCards = cards.length;
  const masteryPercentage = totalCards > 0 ? (matureCards / totalCards) * 100 : 0;
  
  
  const masteredCards = cards.filter(c => c.interval > 21 && c.repetitions > 0);
  const averageRepetitions = masteredCards.length > 0
    ? masteredCards.reduce((sum, c) => sum + c.repetitions, 0) / masteredCards.length
    : null;
  
  
  const averageTimeToMastery = averageRepetitions ? Math.round(averageRepetitions * 1.5) : null;
  
  return {
    matureCards,
    totalCards,
    masteryPercentage: Math.round(masteryPercentage * 10) / 10,
    averageTimeToMastery,
  };
}