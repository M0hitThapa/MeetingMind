import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { compareMeetings } from '@/lib/analysis';

const compareSchema = z.object({
  meetingIds: z.array(z.string()).min(2).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingIds } = compareSchema.parse(body);

    const meetings = await prisma.meeting.findMany({
      where: { id: { in: meetingIds } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        summary: true,
        decisions: true,
        actionItems: true,
        topics: true,
        sentiment: true,
      },
    });

    if (meetings.length !== meetingIds.length) {
      return NextResponse.json(
        { error: 'One or more meetings not found' },
        { status: 404 }
      );
    }

    const meetingsData = meetings.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));

    const comparison = await compareMeetings(meetingsData as any);

    return NextResponse.json({ success: true, data: comparison });

  } catch (error) {
    console.error('Compare error:', error);
    return NextResponse.json(
      { error: 'Failed to compare meetings' },
      { status: 500 }
    );
  }
}