'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle, ListTodo, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TamboComponentProps, MeetingSummaryData } from './types';
import { formatDuration, cn } from '@/lib/utils';

export function MeetingSummary({ data, className }: TamboComponentProps<MeetingSummaryData>) {
  const { 
    summary, 
    keyPoints = [], 
    duration, 
    participantCount, 
    decisionCount, 
    actionItemCount,
    sentiment,
    meetingDate 
  } = data;

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">📝</span>
            Meeting Summary
          </CardTitle>
          {sentiment && (
            <Badge variant="outline" className={getSentimentColor()}>
              {getSentimentIcon()}
              <span className="ml-1 capitalize">{sentiment}</span>
            </Badge>
          )}
        </div>
        {meetingDate && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(meetingDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-muted-foreground leading-relaxed text-sm">{summary}</p>
        
        {keyPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Key Points</h4>
            <ul className="space-y-2">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          {duration !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </Badge>
          )}
          {participantCount !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
              <Users className="w-3 h-3" />
              {participantCount} participants
            </Badge>
          )}
          {decisionCount !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
              <CheckCircle className="w-3 h-3" />
              {decisionCount} decisions
            </Badge>
          )}
          {actionItemCount !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
              <ListTodo className="w-3 h-3" />
              {actionItemCount} action items
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}