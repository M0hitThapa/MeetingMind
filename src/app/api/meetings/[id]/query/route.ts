import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { answerQuery } from '@/lib/analysis';
import type { QueryResponse } from '@/types';

const querySchema = z.object({
  query: z.string().min(1).max(2000),
  voiceInput: z.boolean().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(), 
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { query, voiceInput, userId, sessionId } = querySchema.parse(body);

    
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        queries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meeting.status !== 'completed') {
      return NextResponse.json(
        { error: 'Meeting analysis not complete' },
        { status: 400 }
      );
    }

    
    let chatSessionId = sessionId;
    let isNewSession = false;
    
    if (!chatSessionId && userId) {
      
      const title = query.slice(0, 50) + (query.length > 50 ? '...' : '');
      const session = await prisma.chatSession.create({
        data: {
          meetingId: id,
          userId: userId,
          title: title,
        },
      });
      chatSessionId = session.id;
      isNewSession = true;
    } else if (chatSessionId && userId) {
      
      const session = await prisma.chatSession.findFirst({
        where: {
          id: chatSessionId,
          meetingId: id,
          userId: userId,
        },
      });
      
      if (!session) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        );
      }
    }

    
    const meetingData: any = {
      ...meeting,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      queries: meeting.queries?.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
      })),
    };
    
    let response: QueryResponse;
    try {
      response = await answerQuery(meetingData, query);
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      return NextResponse.json({
        success: false,
        error: 'Failed to process query with AI. Please try again.',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 500 });
    }

    
    await prisma.query.create({
      data: {
        chatSessionId: chatSessionId!,
        meetingId: id,
        userId: userId || null,
        query,
        response: response as any,
        components: response.components as any,
        voiceInput: voiceInput || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: response,
      sessionId: isNewSession ? chatSessionId : undefined,
    });

  } catch (error) {
    console.error('Query error:', error);
    const message = error instanceof z.ZodError
      ? 'Invalid query format'
      : error instanceof Error
        ? error.message
        : 'Query processing failed';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
