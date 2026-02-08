'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { startTranscription } from '@/lib/assemblyai';
import type { CreateMeetingInput, UpdateMeetingInput, Meeting } from '@/types';

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  audioUrl: z.string().url(),
  fileType: z.enum(['audio', 'video']),
  hasVideo: z.boolean().optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['pending', 'uploading', 'transcribing', 'analyzing', 'completed', 'error']).optional(),
  progress: z.number().min(0).max(100).optional(),
  transcript: z.string().optional(),
  speakers: z.array(z.any()).optional(),
  chapters: z.array(z.any()).optional(),
  duration: z.number().optional(),
  summary: z.string().optional(),
  decisions: z.array(z.any()).optional(),
  actionItems: z.array(z.any()).optional(),
  topics: z.array(z.any()).optional(),
  nextSteps: z.array(z.any()).optional(),
  risks: z.array(z.any()).optional(),
  sentiment: z.any().optional(),
  keyMoments: z.array(z.any()).optional(),
});


export async function createMeeting(
  input: Omit<CreateMeetingInput, 'status' | 'progress'>
): Promise<{ success: boolean; data?: Meeting; error?: string }> {
  try {
    const validated = createMeetingSchema.parse(input);

    
    const meeting = await prisma.meeting.create({
      data: {
        ...validated,
        status: 'uploading',
        progress: 50, 
      },
    });

    
    revalidatePath('/dashboard');

    
    
    setImmediate(() => {
      startTranscription(meeting.id, validated.audioUrl).catch((error) => {
        console.error('Background transcription error:', error);
        
        prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: 'error', progress: 0 },
        }).catch(console.error);
      });
    });

    return { 
      success: true, 
      data: meeting as unknown as Meeting 
    };

  } catch (error) {
    console.error('Create meeting error:', error);
    const message = error instanceof z.ZodError 
      ? 'Invalid input data' 
      : 'Failed to create meeting';
    return { success: false, error: message };
  }
}

export async function getMeetings(): Promise<{ success: boolean; data?: Meeting[]; error?: string }> {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { queries: true, tasks: true, flashcards: true }
        }
      }
    });

    return { 
      success: true, 
      data: meetings as unknown as Meeting[] 
    };

  } catch (error) {
    console.error('Get meetings error:', error);
    return { success: false, error: 'Failed to fetch meetings' };
  }
}

export async function getMeetingById(
  id: string
): Promise<{ success: boolean; data?: Meeting; error?: string }> {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        queries: { orderBy: { createdAt: 'desc' }, take: 50 },
        tasks: { orderBy: { scheduledFor: 'desc' } },
        flashcards: { include: { deck: true } },
        followUps: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    return { 
      success: true, 
      data: meeting as unknown as Meeting 
    };

  } catch (error) {
    console.error('Get meeting error:', error);
    return { success: false, error: 'Failed to fetch meeting' };
  }
}

export async function updateMeeting(
  id: string,
  input: UpdateMeetingInput
): Promise<{ success: boolean; data?: Meeting; error?: string }> {
  try {
    const validated = updateMeetingSchema.parse(input);
    const meeting = await prisma.meeting.update({
      where: { id },
      data: validated,
    });

    revalidatePath(`/meetings/${id}`);
    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: meeting as unknown as Meeting 
    };

  } catch (error) {
    console.error('Update meeting error:', error);
    return { success: false, error: 'Failed to update meeting' };
  }
}

export async function deleteMeeting(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.meeting.delete({ where: { id } });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete meeting error:', error);
    return { success: false, error: 'Failed to delete meeting' };
  }
}

export async function updateMeetingProgress(
  id: string,
  progress: number,
  status?: string
): Promise<void> {
  try {
    await prisma.meeting.update({
      where: { id },
      data: {
        progress: Math.min(100, Math.max(0, progress)),
        ...(status && { status }),
      },
    });
  } catch (error) {
    console.error('Update progress error:', error);
    throw error;
  }
}


export async function saveTranscriptData(
  id: string,
  data: {
    transcript: string;
    speakers?: any[];
    duration?: number;
    chapters?: any[];
    sentimentAnalysis?: any[];
  }
): Promise<void> {
  try {
    await prisma.meeting.update({
      where: { id },
      data: {
        transcript: data.transcript,
        speakers: data.speakers || [],
        duration: data.duration,
        chapters: data.chapters || [],
        sentiment: data.sentimentAnalysis || [],
        status: 'completed',
        progress: 100,
      },
    });
    
    console.log(`Transcript data saved for meeting ${id}`);
  } catch (error) {
    console.error('Save transcript data error:', error);
    throw error;
  }
}