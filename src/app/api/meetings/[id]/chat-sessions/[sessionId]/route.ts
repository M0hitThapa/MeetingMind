import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        meetingId: id,
        userId: userId,
      },
      include: {
        queries: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    
    const messages = session.queries.flatMap((query) => {
      const userMessage = {
        id: `user-${query.id}`,
        role: 'user' as const,
        content: query.query,
        timestamp: query.createdAt.toISOString(),
        components: [],
      };

      const response = query.response as { 
        answer?: string; 
        components?: unknown[];
      } | null;

      const assistantMessage = {
        id: `assistant-${query.id}`,
        role: 'assistant' as const,
        content: response?.answer || 'No response',
        timestamp: new Date(query.createdAt.getTime() + 1000).toISOString(),
        components: (response?.components || []).map((comp: any, idx: number) => ({
          id: `${query.id}-${idx}`,
          type: comp.type,
          data: comp.data,
          title: comp.title || comp.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          timestamp: new Date(query.createdAt.getTime() + 1000),
        })),
      };

      return [userMessage, assistantMessage];
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages,
      },
    });

  } catch (error) {
    console.error('Chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
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

    
    await prisma.chatSession.delete({
      where: {
        id: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted successfully',
    });

  } catch (error) {
    console.error('Delete chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await params;
    const body = await request.json();
    const { userId, title } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
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

    const updatedSession = await prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        title: title || session.title,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSession.id,
        title: updatedSession.title,
        updatedAt: updatedSession.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Update chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}
