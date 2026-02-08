'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TamboComponentProps, SentimentTimelineData } from './types';

export function SentimentTimeline({ data, className }: TamboComponentProps<SentimentTimelineData>) {
  const { timeline = [], overall, averageScore = 0, volatility = 0 } = data;

  const chartData = timeline.map(t => ({
    time: Math.round(t.timestamp / 60),
    sentiment: t.score,
    label: t.sentiment,
    text: t.text.substring(0, 60) + (t.text.length > 60 ? '...' : ''),
    speaker: t.speaker,
  }));

  const getOverallIcon = () => {
    switch (overall) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getOverallColor = () => {
    switch (overall) {
      case 'positive': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (timeline.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No sentiment data available</p>
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
            {getOverallIcon()}
            Sentiment Timeline
            <Badge variant="outline" className={getOverallColor()}>
              {overall.charAt(0).toUpperCase() + overall.slice(1)}
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Avg: {(averageScore * 100).toFixed(0)}%
            {volatility > 0 && ` • Volatility: ${(volatility * 100).toFixed(0)}%`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tickFormatter={(v) => `${v}m`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                domain={[-1, 1]} 
                tickFormatter={(v) => v === 0 ? 'Neu' : v > 0 ? '+' : '-'}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover p-3 rounded-lg border border-border shadow-lg max-w-xs">
                        <p className="text-xs font-medium mb-1">{data.time} minutes</p>
                        <Badge 
                          variant="outline" 
                          className={data.label === 'positive' ? 'bg-green-500/10 text-green-700' : 
                                    data.label === 'negative' ? 'bg-red-500/10 text-red-700' : 
                                    'bg-gray-500/10 text-gray-700'}
                        >
                          {data.label}
                        </Badge>
                        {data.speaker && (
                          <p className="text-xs text-muted-foreground mt-1">Speaker: {data.speaker}</p>
                        )}
                        <p className="text-xs mt-2 italic text-muted-foreground border-t border-border pt-2">
                          &ldquo;{data.text}&rdquo;
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="none" 
                fill="url(#sentimentGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-4 px-2">
          <span>Meeting Start</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Positive
            <div className="w-2 h-2 rounded-full bg-gray-400 ml-2" /> Neutral
            <div className="w-2 h-2 rounded-full bg-red-500 ml-2" /> Negative
          </span>
          <span>Meeting End</span>
        </div>
      </CardContent>
    </Card>
  );
}