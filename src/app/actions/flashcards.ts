'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateFlashcardsFromMeeting } from '@/lib/flashcard-generator';
import { calculateNextReview } from '@/lib/spaced-repitition';
import type {
  Flashcard,
  FlashcardDeck,
  ReviewResult,
  StudyStats,
  ReviewSession
} from '@/types';

const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(0).max(5),
  timeSpent: z.number().positive(),
});


export async function generateFlashcardsFromMeetingAction(
  meetingId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { flashcards: true },
    });

    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (meeting.flashcards.length > 0) {
      return { success: false, error: 'Flashcards already generated for this meeting' };
    }

    
    const meetingData: any = {
      ...meeting,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
    const cards = await generateFlashcardsFromMeeting(meetingData);

    
    let deck = await prisma.flashcardDeck.findFirst({
      where: { name: 'Meeting Notes' },
    });

    if (!deck) {
      deck = await prisma.flashcardDeck.create({
        data: {
          name: 'Meeting Notes',
          description: 'Automatically generated from meetings',
          color: '#3b82f6',
          icon: 'BookOpen',
        },
      });
    }

    
    await prisma.flashcard.createMany({
      data: cards.map(card => ({
        ...card,
        meetingId,
        deckId: deck.id,
      })),
    });

    
    await prisma.flashcardDeck.update({
      where: { id: deck.id },
      data: {
        totalCards: { increment: cards.length },
      },
    });

    revalidatePath('/productivity');
    revalidatePath(`/meetings/${meetingId}`);

    return { success: true, count: cards.length };

  } catch (error) {
    console.error('Generate flashcards error:', error);
    return { success: false, error: 'Failed to generate flashcards' };
  }
}


export async function createDeck(
  input: z.infer<typeof createDeckSchema>
): Promise<{ success: boolean; data?: FlashcardDeck; error?: string }> {
  try {
    const validated = createDeckSchema.parse(input);

    const deck = await prisma.flashcardDeck.create({
      data: validated,
    });

    revalidatePath('/productivity');

    return { success: true, data: deck as unknown as FlashcardDeck };

  } catch (error) {
    console.error('Create deck error:', error);
    return { success: false, error: 'Failed to create deck' };
  }
}


export async function getReviewSession(
  deckId?: string,
  limit: number = 20
): Promise<{ success: boolean; data?: ReviewSession; error?: string }> {
  try {
    const where: any = {
      nextReview: { lte: new Date() },
    };

    if (deckId) {
      where.deckId = deckId;
    }

    const cards = await prisma.flashcard.findMany({
      where,
      orderBy: [
        { nextReview: 'asc' },
        { difficulty: 'desc' },
      ],
      take: limit,
      include: {
        deck: true,
        meeting: {
          select: { title: true },
        },
      },
    });

    const session: ReviewSession = {
      deckId,
      cards: cards as unknown as Flashcard[],
      currentIndex: 0,
      stats: {
        reviewed: 0,
        correct: 0,
        timeSpent: 0,
      },
    };

    return { success: true, data: session };

  } catch (error) {
    console.error('Get review session error:', error);
    return { success: false, error: 'Failed to get review session' };
  }
}


export async function reviewFlashcard(
  flashcardId: string,
  input: z.infer<typeof reviewSchema>
): Promise<{ success: boolean; data?: ReviewResult; error?: string }> {
  try {
    const { rating, timeSpent } = reviewSchema.parse(input);

    const flashcard = await prisma.flashcard.findUnique({
      where: { id: flashcardId },
    });

    if (!flashcard) {
      return { success: false, error: 'Flashcard not found' };
    }

    
    const result = calculateNextReview(flashcard, rating);

    
    await prisma.flashcard.update({
      where: { id: flashcardId },
      data: {
        easeFactor: result.newEaseFactor,
        interval: result.newInterval,
        repetitions: flashcard.repetitions + 1,
        nextReview: new Date(result.nextReview),
        lastReviewed: new Date(),
        timesReviewed: { increment: 1 },
        timesCorrect: rating >= 3 ? { increment: 1 } : undefined,
        averageTime: flashcard.averageTime
          ? (flashcard.averageTime * flashcard.timesReviewed + timeSpent) / (flashcard.timesReviewed + 1)
          : timeSpent,
      },
    });

    
    await prisma.flashcardReview.create({
      data: {
        flashcardId,
        rating,
        timeSpent,
        wasCorrect: rating >= 3,
        previousInterval: flashcard.interval,
        previousEase: flashcard.easeFactor,
      },
    });

    
    if (result.newInterval > 21 && flashcard.interval <= 21) {
      await prisma.flashcardDeck.update({
        where: { id: flashcard.deckId || undefined },
        data: { matureCards: { increment: 1 } },
      });
    }

    return {
      success: true,
      data: {
        flashcardId,
        rating,
        timeSpent,
        nextReview: result.nextReview,
        newInterval: result.newInterval,
        newEaseFactor: result.newEaseFactor,
      }
    };

  } catch (error) {
    console.error('Review flashcard error:', error);
    return { success: false, error: 'Failed to process review' };
  }
}


export async function moveCardsToDeck(
  cardIds: string[],
  deckId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const result = await prisma.flashcard.updateMany({
      where: { id: { in: cardIds } },
      data: { deckId },
    });

    revalidatePath('/productivity');

    return { success: true, count: result.count };

  } catch (error) {
    console.error('Move cards error:', error);
    return { success: false, error: 'Failed to move cards' };
  }
}


export async function deleteFlashcard(
  cardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.flashcard.delete({
      where: { id: cardId },
    });

    revalidatePath('/productivity');

    return { success: true };

  } catch (error) {
    console.error('Delete flashcard error:', error);
    return { success: false, error: 'Failed to delete flashcard' };
  }
}


export async function editFlashcard(
  cardId: string,
  updates: Partial<Flashcard>
): Promise<{ success: boolean; data?: Flashcard; error?: string }> {
  try {
    const card = await prisma.flashcard.update({
      where: { id: cardId },
      data: updates as any,
    });

    revalidatePath('/productivity');

    return { success: true, data: card as unknown as Flashcard };

  } catch (error) {
    console.error('Edit flashcard error:', error);
    return { success: false, error: 'Failed to edit flashcard' };
  }
}


export async function getStudyStats(
  userId?: string
): Promise<{ success: boolean; data?: StudyStats; error?: string }> {
  try {
    const [
      totalCards,
      dueToday,
      newCards,
      reviewedToday,
      cardsByDifficulty,
    ] = await Promise.all([
      prisma.flashcard.count(),
      prisma.flashcard.count({
        where: { nextReview: { lte: new Date() } },
      }),
      prisma.flashcard.count({
        where: { repetitions: 0 },
      }),
      prisma.flashcardReview.count({
        where: {
          reviewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.flashcard.groupBy({
        by: ['difficulty'],
        _count: { difficulty: true },
      }),
    ]);

    
    const streakDays = Math.floor(reviewedToday / 10); 

    
    const reviews = await prisma.flashcardReview.findMany({
      take: 1000,
      orderBy: { reviewedAt: 'desc' },
    });

    const averageRetention = reviews.length > 0
      ? reviews.filter(r => r.wasCorrect).length / reviews.length
      : 0;

    const totalStudyTime = reviews.reduce((acc, r) => acc + r.timeSpent, 0);

    const stats: StudyStats = {
      totalCards,
      dueToday,
      newCards,
      reviewedToday,
      streakDays,
      averageRetention,
      totalStudyTime,
      cardsByDifficulty: Object.fromEntries(
        cardsByDifficulty.map(c => [c.difficulty, c._count.difficulty])
      ),
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error('Get study stats error:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}