'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, AlertCircle, CheckCircle, MessageSquare, Zap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, TimelineViewData } from './types';

export function TimelineView({ data, className }: TamboComponentProps<TimelineViewData>) {
  const { events = [], duration, chapters = [] } = data;
  
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'decision': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'action': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'key_moment': return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case 'sentiment_shift': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'topic_change': return <BookOpen className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'decision': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'action': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'key_moment': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'sentiment_shift': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'topic_change': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  
  const getChapterForTimestamp = (timestamp: number) => {
    if (chapters.length === 0) return null;
    return chapters.find(ch => timestamp >= ch.start && timestamp <= ch.end);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Meeting Timeline
          {duration && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {formatTime(duration)} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-6">
          
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent" />
          
          {sortedEvents.map((event, index) => {
            const chapter = getChapterForTimestamp(event.timestamp);
            const showChapter = chapter && (index === 0 || getChapterForTimestamp(sortedEvents[index - 1].timestamp)?.title !== chapter.title);
            
            return (
              <div key={index} className="relative">
                
                {showChapter && (
                  <div className="mb-3 -ml-4">
                    <Badge variant="outline" className="text-xs bg-muted">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {chapter.title}
                    </Badge>
                  </div>
                )}
                
                
                <div className={cn(
                  "absolute -left-5 mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-background",
                  event.importance && event.importance > 0.7 ? "bg-primary w-3 h-3" : "bg-muted-foreground"
                )} />
                
                <div className="flex items-start gap-3 group">
                  <span className="text-xs font-mono text-muted-foreground min-w-[3.5rem] tabular-nums">
                    {formatTime(event.timestamp)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", getBadgeColor(event.type || 'default'))}>
                        {getIcon(event.type || 'default')}
                        <span className="ml-1 capitalize">{(event.type || 'event').replace('_', ' ')}</span>
                      </Badge>
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.speaker && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {event.speaker}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {duration && chapters.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{chapters.length} chapters</span>
              <span>{sortedEvents.length} key moments</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}