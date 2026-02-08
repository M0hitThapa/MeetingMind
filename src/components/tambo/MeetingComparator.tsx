'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Lightbulb, Calendar } from 'lucide-react';
import type { TamboComponentProps, MeetingComparatorData } from './types';

export function MeetingComparator({ data, className }: TamboComponentProps<MeetingComparatorData>) {
  const { trends = [], meetings = [], insights = [] } = data;

  
  const chartData = meetings.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...m.metrics,
    sentiment: m.sentiment === 'positive' ? 1 : m.sentiment === 'negative' ? -1 : 0,
  }));

  const metricKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(k => k !== 'date') : [];

  const colors = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Meeting Trends & Patterns
          <Badge variant="secondary" className="ml-2">
            {meetings.length} meetings
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {chartData.length > 0 && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {metricKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        
        {insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              AI Insights
            </h4>
            <div className="grid gap-2">
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary"
                >
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recent Meetings</h4>
          <div className="space-y-2">
            {meetings.slice(-5).map(meeting => (
              <div 
                key={meeting.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {Object.entries(meeting.metrics).slice(0, 2).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}