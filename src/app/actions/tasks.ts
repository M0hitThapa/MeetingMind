'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {prisma} from "@/lib/prisma"
import type { 
  Task, 
  CreateTaskInput, 
  TaskFilter, 
  TaskStats, 
  DependencyGraph 
} from '@/types';

const createTaskSchema = z.object({
  meetingId: z.string(),
  actionItemId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  owner: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  category: z.enum(['work', 'personal', 'learning', 'admin']).optional(),
  tags: z.array(z.string()).default([]),
  project: z.string().optional(),
  energyLevel: z.enum(['high', 'medium', 'low']).optional(),
  context: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  owner: z.string().optional(),
  delegatedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  actualHours: z.number().positive().optional(),
  category: z.enum(['work', 'personal', 'learning', 'admin']).optional(),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  blockedBy: z.array(z.string()).optional(),
  blocking: z.array(z.string()).optional(),
  energyLevel: z.enum(['high', 'medium', 'low']).optional(),
});


export async function createTaskFromActionItem(
  meetingId: string,
  actionItem: {
    id: string;
    text: string;
    assignee?: string;
    priority?: string;
    dueDate?: string;
  }
): Promise<{ success: boolean; data?: Task; error?: string }> {
  try {
    const task = await prisma.task.create({
      data: {
        meetingId,
        actionItemId: actionItem.id,
        title: actionItem.text,
        owner: actionItem.assignee,
        priority: (actionItem.priority as any) || 'medium',
        dueDate: actionItem.dueDate ? new Date(actionItem.dueDate) : undefined,
        status: 'todo',
        tags: [],
        blockedBy: [],
        blocking: [],
      },
    });

    revalidatePath('/productivity');
    revalidatePath(`/meetings/${meetingId}`);

    return { success: true, data: task as unknown as Task };

  } catch (error) {
    console.error('Create task error:', error);
    return { success: false, error: 'Failed to create task' };
  }
}


export async function createTask(
  input: Omit<CreateTaskInput, 'id' | 'status' | 'blockedBy' | 'blocking' | 'createdAt'>
): Promise<{ success: boolean; data?: Task; error?: string }> {
  try {
    const validated = createTaskSchema.parse(input);

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        status: 'todo',
        blockedBy: [],
        blocking: [],
      },
    });

    revalidatePath('/productivity');

    return { success: true, data: task as unknown as Task };

  } catch (error) {
    console.error('Create task error:', error);
    return { success: false, error: 'Failed to create task' };
  }
}


export async function updateTask(
  taskId: string,
  input: Partial<CreateTaskInput>
): Promise<{ success: boolean; data?: Task; error?: string }> {
  try {
    const validated = updateTaskSchema.parse(input);

    
    if (validated.status === 'completed' && !validated.completedAt) {
      validated.completedAt = new Date().toISOString();
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        scheduledFor: validated.scheduledFor ? new Date(validated.scheduledFor) : undefined,
        completedAt: validated.completedAt ? new Date(validated.completedAt) : undefined,
      },
    });

    revalidatePath('/productivity');
    if (task.meetingId) {
      revalidatePath(`/meetings/${task.meetingId}`);
    }

    return { success: true, data: task as unknown as Task };

  } catch (error) {
    console.error('Update task error:', error);
    return { success: false, error: 'Failed to update task' };
  }
}


export async function bulkUpdateTasks(
  taskIds: string[],
  updates: Partial<CreateTaskInput>
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: updates,
    });

    revalidatePath('/productivity');

    return { success: true, count: result.count };

  } catch (error) {
    console.error('Bulk update error:', error);
    return { success: false, error: 'Failed to update tasks' };
  }
}


export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath('/productivity');

    return { success: true };

  } catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}


export async function getUserTasks(
  userId: string,
  filter?: TaskFilter
): Promise<{ success: boolean; data?: Task[]; error?: string }> {
  try {
    const where: any = {
      OR: [
        { owner: userId },
        { delegatedTo: userId },
      ],
    };

    if (filter?.status?.length) {
      where.status = { in: filter.status };
    }

    if (filter?.priority?.length) {
      where.priority = { in: filter.priority };
    }

    if (filter?.category?.length) {
      where.category = { in: filter.category };
    }

    if (filter?.tags?.length) {
      where.tags = { hasSome: filter.tags };
    }

    if (filter?.dueBefore) {
      where.dueDate = { lte: new Date(filter.dueBefore) };
    }

    if (filter?.dueAfter) {
      where.dueDate = { gte: new Date(filter.dueAfter) };
    }

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
      include: {
        meeting: {
          select: { id: true, title: true },
        },
      },
    });

    return { success: true, data: tasks as unknown as Task[] };

  } catch (error) {
    console.error('Get tasks error:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}


export async function getTaskStats(
  userId: string
): Promise<{ success: boolean; data?: TaskStats; error?: string }> {
  try {
    const [
      total,
      byStatus,
      byPriority,
      completedToday,
      completedThisWeek,
      overdue,
      upcoming,
    ] = await Promise.all([
      prisma.task.count({
        where: { OR: [{ owner: userId }, { delegatedTo: userId }] },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { OR: [{ owner: userId }, { delegatedTo: userId }] },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { OR: [{ owner: userId }, { delegatedTo: userId }] },
        _count: { priority: true },
      }),
      prisma.task.count({
        where: {
          OR: [{ owner: userId }, { delegatedTo: userId }],
          status: 'completed',
          completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ owner: userId }, { delegatedTo: userId }],
          status: 'completed',
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ owner: userId }, { delegatedTo: userId }],
          status: { not: 'completed' },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ owner: userId }, { delegatedTo: userId }],
          status: { not: 'completed' },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const stats: TaskStats = {
      total,
      byStatus: {
        todo: 0,
        in_progress: 0,
        blocked: 0,
        completed: 0,
        cancelled: 0,
        ...Object.fromEntries(byStatus.map(s => [s.status, s._count.status])),
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        ...Object.fromEntries(byPriority.map(p => [p.priority, p._count.priority])),
      },
      completedToday,
      completedThisWeek,
      overdue,
      upcoming,
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error('Get stats error:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}


export async function detectDependencies(
  tasks: Task[]
): Promise<{ success: boolean; data?: DependencyGraph; error?: string }> {
  
  
  const graph: DependencyGraph = {
    nodes: tasks.map(t => ({ id: t.id, title: t.title, status: t.status })),
    edges: [],
  };

  return { success: true, data: graph };
}


export async function suggestSchedule(
  tasks: Task[]
): Promise<{ success: boolean; data?: Task[]; error?: string }> {
  
  
  const sorted = [...tasks].sort((a, b) => {
    const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  return { success: true, data: sorted };
}