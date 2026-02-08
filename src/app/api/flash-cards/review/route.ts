import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reviewFlashcard } from '@/app/actions/flashcards';

const reviewSchema = z.object({
  flashcardId: z.string(),
  rating: z.number().min(0).max(5),
  timeSpent: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flashcardId, rating, timeSpent } = reviewSchema.parse(body);

    const result = await reviewFlashcard(flashcardId, { rating, timeSpent });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}