'use client'

import { useMeetingProgress } from '@/hooks/meetingProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Meeting } from '../../../generated/prisma/client'

interface MeetingDetailProps {
  initialMeeting: Meeting
}

export function MeetingDetail({ initialMeeting }: MeetingDetailProps) {
  const { meeting, isPolling } = useMeetingProgress(initialMeeting)

  const getStatusIcon = () => {
    switch (meeting.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <h1 className="text-3xl font-bold">{meeting.title}</h1>
        <Badge variant="outline">{meeting.status}</Badge>
      </div>

      
      {(meeting.status === 'pending' || meeting.status === 'transcribing') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Processing Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={meeting.progress || 10} />
            <p className="text-sm text-gray-500">
              {isPolling ? 'Checking progress...' : 'Processing...'}
            </p>
          </CardContent>
        </Card>
      )}

      
      {meeting.transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {meeting.transcript.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      
      {meeting.speakers && Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Speakers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {meeting.speakers.map((utterance: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-blue-600">
                    Speaker {utterance.speaker}
                  </p>
                  <p className="text-gray-700">{utterance.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      
      {meeting.chapters && Array.isArray(meeting.chapters) && meeting.chapters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meeting.chapters.map((chapter: any, i: number) => (
                <div key={i} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">{chapter.headline}</h4>
                  <p className="text-sm text-gray-600">{chapter.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}