'use client'

import { useEffect, useState } from 'react'
import { Meeting } from '../../generated/prisma/client'

export function useMeetingProgress(initialMeeting: Meeting) {
  const [meeting, setMeeting] = useState(initialMeeting)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    
    const shouldPoll = 
      meeting.status === 'pending' || 
      meeting.status === 'transcribing'

    if (!shouldPoll) return

    setIsPolling(true)

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/meetings/${meeting.id}`)
        if (!response.ok) throw new Error('Failed to fetch')
        
        const data = await response.json()
        if (data.success) {
          setMeeting(data.meeting)
          
          
          if (data.meeting.status === 'completed' || data.meeting.status === 'error') {
            setIsPolling(false)
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) 

    return () => {
      clearInterval(interval)
      setIsPolling(false)
    }
  }, [meeting.id, meeting.status])

  return { meeting, isPolling }
}