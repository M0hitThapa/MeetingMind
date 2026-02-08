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

    const sessions = await prisma.chatSession.findMany({
      where: {
        meetingId: id,
        userId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: { queries: true }
        }
      }
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title || 'New Chat',
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messageCount: session._count.queries * 2, 
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
    });

  } catch (error) {
    console.error('Chat sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, title } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.create({
      data: {
        meetingId: id,
        userId: userId,
        title: title || 'New Chat',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messageCount: 0,
      },
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
