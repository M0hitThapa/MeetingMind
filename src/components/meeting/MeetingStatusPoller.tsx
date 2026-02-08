'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProcessingStatus } from '@/components/meeting/ProcessingStatus';
import type { Meeting } from '@/types';

interface MeetingStatusPollerProps {
  meeting: Meeting;
}

export function MeetingStatusPoller({ meeting }: MeetingStatusPollerProps) {
  const router = useRouter();
  const [currentMeeting, setCurrentMeeting] = useState(meeting);
  const [isPolling, setIsPolling] = useState(false);

  const isProcessing = 
    currentMeeting.status !== 'completed' && 
    currentMeeting.status !== 'error';

  useEffect(() => {
    if (!isProcessing) return;

    setIsPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        
        const response = await fetch(`/api/meetings/${currentMeeting.id}/status`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const freshMeeting = data.data;
          setCurrentMeeting(freshMeeting);
          
          
          if (freshMeeting.status === 'completed' || freshMeeting.status === 'error') {
            clearInterval(pollInterval);
            setIsPolling(false);
            router.refresh(); 
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); 

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [currentMeeting.id, isProcessing, router]);

  
  if (!isProcessing) return null;

  return (
    <div className="mb-8">
      <ProcessingStatus
        status={currentMeeting.status}
        progress={currentMeeting.progress}
      />
      {isPolling && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Live updates enabled
        </p>
      )}
    </div>
  );
}
