import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true,
        title: true,
        transcript: true,
        duration: true,
        speakers: true,
        summary: true,
        decisions: true,
        actionItems: true,
        createdAt: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meeting status' },
      { status: 500 }
    );
  }
}
