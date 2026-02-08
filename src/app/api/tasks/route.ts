import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  meetingId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  owner: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const status = searchParams.get('status');
    const meetingId = searchParams.get('meetingId');

    const where: any = {};
    if (owner) where.owner = owner;
    if (status) where.status = status;
    if (meetingId) where.meetingId = meetingId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { scheduledFor: 'desc' },
      include: { meeting: { select: { title: true } } },
    });

    return NextResponse.json({ success: true, data: tasks });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: 'todo',
        tags: [],
        blockedBy: [],
        blocking: [],
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}