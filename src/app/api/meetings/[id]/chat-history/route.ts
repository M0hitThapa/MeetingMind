import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    
    const queries = await prisma.query.findMany({
      where: {
        meetingId: id,
        userId: userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    
    const messages = queries.flatMap((query) => {
      const userMessage = {
        id: `user-${query.id}`,
        role: 'user' as const,
        content: query.query,
        timestamp: query.createdAt.toISOString(),
        components: [],
      };

      const response = query.response as { 
        answer?: string; 
        components?: any[];
        suggestedFollowUps?: string[];
      };

      const assistantMessage = {
        id: `assistant-${query.id}`,
        role: 'assistant' as const,
        content: response?.answer || 'No response',
        timestamp: new Date(query.createdAt.getTime() + 1000).toISOString(), 
        components: response?.components?.map((comp: any, idx: number) => ({
          id: `${query.id}-${idx}`,
          type: comp.type,
          data: comp.data,
          title: comp.title || comp.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          timestamp: new Date(query.createdAt.getTime() + 1000),
        })) || [],
      };

      return [userMessage, assistantMessage];
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });

  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
