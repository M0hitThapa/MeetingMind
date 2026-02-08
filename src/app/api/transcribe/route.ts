import { NextRequest, NextResponse } from 'next/server'
import { startTranscription, pollTranscription } from '@/lib/assemblyai'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const USER_ID_COOKIE = 'meetingmind_user_id'

export async function POST(request: NextRequest) {
  try {
    const { meetingId } = await request.json()

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    if (!meeting.audioUrl) {
      return NextResponse.json(
        { error: 'No audio file attached' },
        { status: 400 }
      )
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'transcribing' }
    })

    
    const cookieStore = await cookies()
    const userId = cookieStore.get(USER_ID_COOKIE)?.value

    processTranscription(meetingId, meeting.audioUrl, userId)

    return NextResponse.json({
      success: true,
      message: 'Transcription started'
    })

  } catch (error) {
    console.error('Transcription start error:', error)
    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    )
  }
}


async function processTranscription(meetingId: string, audioUrl: string, userId?: string) {
  try {
    await startTranscription(meetingId, audioUrl);
    console.log(`Started transcription for meeting ${meetingId}`)

    
    try {
      const analyzeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, userId }),
      });
      if (!analyzeRes.ok) {
        console.error('Analysis failed:', await analyzeRes.text());
      } else {
        const analyzeData = await analyzeRes.json();
        console.log(`Analysis completed for meeting ${meetingId}:`, analyzeData.data);
      }
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
    }

  } catch (error) {
    console.error(`Transcription failed for ${meetingId}:`, error)

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'error',
      }
    })
  }
}