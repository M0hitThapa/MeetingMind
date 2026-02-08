import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {prisma} from '@/lib/prisma';


const followUpSchema = z.object({
  meetingId: z.string(),
  actionItemId: z.string(),
  type: z.enum(['email', 'slack', 'sms', 'in_app']),
  recipient: z.string().email(),
  message: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = followUpSchema.parse(body);

    const followUp = await prisma.followUp.create({
      data: {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : new Date(),
        status: 'scheduled',
      },
    });

    
    
    if (!data.scheduledFor) {
      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, data: followUp });

  } catch (error) {
    console.error('Follow-up error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule follow-up' },
      { status: 500 }
    );
  }
}