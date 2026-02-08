'use client';

import { useEffect, useState } from 'react';
import type { Meeting } from '@/types';

export function useMeetingProgress(meeting: Meeting, refreshInterval: number = 5000) {
  const [currentMeeting, setCurrentMeeting] = useState(meeting);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    
    const shouldPoll = 
      currentMeeting.status !== 'completed' && 
      currentMeeting.status !== 'error';

    if (!shouldPoll) return;

    setIsPolling(true);

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/meetings/${currentMeeting.id}`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentMeeting(data.data);
          
          
          if (data.data.status === 'completed' || data.data.status === 'error') {
            setIsPolling(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
      }
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [currentMeeting.id, currentMeeting.status, refreshInterval]);

  return { meeting: currentMeeting, isPolling };
}