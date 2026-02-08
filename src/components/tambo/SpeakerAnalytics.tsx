'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Mic2, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, SpeakerAnalyticsData } from './types';

export function SpeakerAnalytics({ data, className }: TamboComponentProps<SpeakerAnalyticsData>) {
  const { speakers = [], totalSpeakingTime } = data;
  
  const totalTime = speakers.reduce((acc, s) => acc + s.speakingTime, 0);
  const sortedSpeakers = [...speakers].sort((a, b) => b.speakingTime - a.speakingTime);

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'negative': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  if (speakers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Speaker Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mic2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No speaker data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Speaking Time Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSpeakers.map((speaker, index) => (
          <div key={speaker.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarImage src={speaker.avatar} alt={speaker.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {speaker.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{speaker.name}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        Most Active
                      </Badge>
                    )}
                    {speaker.sentiment && getSentimentIcon(speaker.sentiment)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{Math.round(speaker.speakingTime / 60)} min</span>
                    {speaker.segments && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {speaker.segments} segments
                        </span>
                      </>
                    )}
                    {speaker.interventions && (
                      <>
                        <span>•</span>
                        <span>{speaker.interventions} interventions</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {Math.round(speaker.percentage)}%
              </span>
            </div>
            <Progress 
              value={speaker.percentage} 
              className="h-2"
            />
          </div>
        ))}
        
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total speaking time</span>
            <span className="font-medium">{Math.round(totalTime / 60)} minutes</span>
          </div>
          {totalSpeakingTime && totalSpeakingTime !== totalTime && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Meeting duration</span>
              <span className="font-medium">{Math.round(totalSpeakingTime / 60)} minutes</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Participation balance</span>
            <span className={cn(
              "font-medium",
              sortedSpeakers[0]?.percentage > 50 ? "text-yellow-600" : "text-green-600"
            )}>
              {sortedSpeakers[0]?.percentage > 50 ? 'Dominant speaker' : 'Balanced'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}