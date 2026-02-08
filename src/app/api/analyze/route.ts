import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeMeeting } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const { meetingId, userId } = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (!meeting.transcript) {
      return NextResponse.json(
        { error: 'No transcript available for analysis' },
        { status: 400 }
      );
    }

    
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'analyzing', progress: 70 },
    });

    
    const analysis = await analyzeMeeting(
      meeting.transcript,
      meeting.speakers as any[]
    );

    
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        summary: analysis.summary,
        decisions: analysis.decisions as any,
        actionItems: analysis.actionItems as any,
        topics: analysis.topics as any,
        sentiment: analysis.sentiment as any,
        keyMoments: analysis.keyMoments as any,
        status: 'completed',
        progress: 100,
      },
    });

    
    const createdTasks = [];
    if (analysis.actionItems && analysis.actionItems.length > 0) {
      for (const actionItem of analysis.actionItems) {
        try {
          const task = await prisma.task.create({
            data: {
              meetingId,
              actionItemId: actionItem.id || `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: actionItem.text,
              owner: userId || null, 
              priority: (actionItem.priority as any) || 'medium',
              dueDate: actionItem.dueDate ? new Date(actionItem.dueDate) : undefined,
              status: 'todo',
              tags: [],
              blockedBy: [],
              blocking: [],
            },
          });
          createdTasks.push(task);
        } catch (err) {
          console.error('Failed to create task from action item:', err);
        }
      }
    }

    console.log(`[Analyze] Meeting ${meetingId} analyzed. Created ${createdTasks.length} tasks from ${analysis.actionItems?.length || 0} action items`);

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        decisionsCount: analysis.decisions?.length || 0,
        actionItemsCount: analysis.actionItems?.length || 0,
        tasksCreated: createdTasks.length,
        topicsCount: analysis.topics?.length || 0,
      },
    });

  } catch (error) {
    console.error('Analysis error:', error);

    
    try {
      const { meetingId } = await request.json();
      if (meetingId) {
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { status: 'error', progress: 0 },
        });
      }
    } catch {
      
    }

    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
