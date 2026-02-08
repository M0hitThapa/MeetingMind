'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileAudio, 
  FileVideo, 
  Calendar, 
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Meeting } from '@/types';

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const getStatusIcon = () => {
    switch (meeting.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'uploading':
      case 'transcribing':
      case 'analyzing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (meeting.status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse';
    }
  };

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {meeting.fileType === 'video' ? (
                <FileVideo className="w-5 h-5 text-blue-500" />
              ) : (
                <FileAudio className="w-5 h-5 text-green-500" />
              )}
              <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {meeting.title}
              </h3>
            </div>
            <Badge variant="outline" className={getStatusColor()}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {meeting.status}
              </span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          
          {meeting.status !== 'completed' && meeting.status !== 'error' && (
            <div className="space-y-1">
              <Progress value={meeting.progress} className="h-1" />
              <p className="text-xs text-muted-foreground text-center">
                {meeting.progress}% complete
              </p>
            </div>
          )}

          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(meeting.createdAt)}
            </span>
            {meeting.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.round(meeting.duration / 60)} min
              </span>
            )}
          </div>

          
          {meeting.status === 'completed' && (
            <div className="flex gap-2 pt-2 border-t border-border">
              {meeting.decisions && meeting.decisions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {meeting.decisions.length} decisions
                </Badge>
              )}
              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {meeting.actionItems.length} actions
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}