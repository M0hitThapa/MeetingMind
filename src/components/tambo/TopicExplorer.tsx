'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, TopicExplorerData } from './types';

export function TopicExplorer({ data, className }: TamboComponentProps<TopicExplorerData>) {
  const { topics = [], totalTopics, dominantTopic } = data;
  const sortedTopics = [...topics].sort((a, b) => b.relevance - a.relevance);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'negative': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  if (topics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Topics Discussed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No topics identified</p>
            <p className="text-sm mt-1">Topics will be extracted automatically</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Topics Discussed
            {totalTopics && (
              <Badge variant="secondary" className="ml-2">
                {totalTopics} total
              </Badge>
            )}
          </CardTitle>
          {dominantTopic && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              Top: <span className="font-medium text-foreground">{dominantTopic}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sortedTopics.map((topic, index) => (
            <Badge 
              key={topic.name}
              variant="secondary"
              className={cn(
                "text-sm py-1.5 px-3 transition-all duration-200 hover:scale-105 cursor-default",
                index === 0 && "bg-primary/10 text-primary border-primary/20 font-semibold",
                topic.sentiment && index !== 0 && getSentimentColor(topic.sentiment)
              )}
              style={{ 
                opacity: 0.4 + (topic.relevance * 0.6),
                fontSize: `${0.75 + (topic.relevance * 0.25)}rem`
              }}
            >
              {index === 0 && <Sparkles className="w-3 h-3 mr-1" />}
              {topic.name}
              <span className="ml-2 text-xs opacity-60 font-normal">
                {topic.occurrences > 1 && `${topic.occurrences}x `}
                {Math.round(topic.relevance * 100)}%
              </span>
            </Badge>
          ))}
        </div>
        
        {sortedTopics.length > 0 && sortedTopics[0].relatedTopics && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Related themes:</p>
            <div className="flex flex-wrap gap-1">
              {sortedTopics[0].relatedTopics.map(related => (
                <span key={related} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {related}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}