import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {prisma} from '@/lib/prisma';

const createSchema = z.object({
  meetingId: z.string(),
  deckId: z.string().optional(),
  cardType: z.enum(['basic', 'cloze', 'multiple_choice', 'definition', 'concept']),
  question: z.string().min(1),
  answer: z.string().min(1),
  context: z.string().optional(),
  options: z.array(z.string()).default([]),
  correctOption: z.number().optional(),
  difficulty: z.number().min(1).max(5).default(3),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');
    const meetingId = searchParams.get('meetingId');
    const dueOnly = searchParams.get('dueOnly') === 'true';

    const where: any = {};
    if (deckId) where.deckId = deckId;
    if (meetingId) where.meetingId = meetingId;
    if (dueOnly) where.nextReview = { lte: new Date() };

    const cards = await prisma.flashcard.findMany({
      where,
      orderBy: { nextReview: 'asc' },
      include: { deck: true, meeting: { select: { title: true } } },
    });

    return NextResponse.json({ success: true, data: cards });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const card = await prisma.flashcard.create({
      data: {
        ...data,
        options: data.options || [],
        tags: [],
        nextReview: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: card }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}