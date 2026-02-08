'use client';

import { useMeetingProgress } from '@/hooks/useMeetingProgress';
import { ProcessingStatus } from './ProcessingStatus';
import type { Meeting } from '@/types';

interface RealtimeMeetingWrapperProps {
  meeting: Meeting;
  children: React.ReactNode;
}

export function RealtimeMeetingWrapper({ meeting, children }: RealtimeMeetingWrapperProps) {
  const { meeting: liveMeeting } = useMeetingProgress(meeting);

  const isProcessing = 
    liveMeeting.status !== 'completed' && 
    liveMeeting.status !== 'error';

  return (
    <div className="space-y-6">
      {isProcessing && (
        <ProcessingStatus 
          status={liveMeeting.status} 
          progress={liveMeeting.progress}
        />
      )}
      
      {liveMeeting.status === 'completed' ? (
        children
      ) : (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}