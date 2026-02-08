'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  Flame, 
  Clock, 
  TrendingUp,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TamboComponentProps, StudyDashboardData } from './types';

export function StudyDashboard({ data, className }: TamboComponentProps<StudyDashboardData>) {
  const {
    totalCards,
    dueToday,
    newCards,
    reviewedToday,
    streakDays,
    averageRetention,
    totalStudyTime,
    masteryLevel = 'beginner',
    weakestAreas = [],
    strongestAreas = []
  } = data;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const masteryColors = {
    beginner: 'bg-gray-500',
    intermediate: 'bg-blue-500',
    advanced: 'bg-purple-500',
    expert: 'bg-yellow-500'
  };

  
  const studyHistory = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    cards: Math.floor(Math.random() * 20) + 5,
    retention: 0.7 + Math.random() * 0.25
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Study Dashboard
          </CardTitle>
          <Badge className={masteryColors[masteryLevel]}>
            {masteryLevel.charAt(0).toUpperCase() + masteryLevel.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-primary">{dueToday}</span>
            </div>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{newCards}</span>
            </div>
            <p className="text-xs text-muted-foreground">New Cards</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{streakDays}</span>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{Math.round(averageRetention * 100)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Retention</p>
          </div>
        </div>

        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Daily Progress ({reviewedToday} reviewed)
              </span>
              <span>{Math.round((reviewedToday / Math.max(dueToday, 1)) * 100)}%</span>
            </div>
            <Progress value={(reviewedToday / Math.max(dueToday, 1)) * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Study Time ({formatTime(totalStudyTime)})
              </span>
              <span>{Math.min((totalStudyTime / 3600) * 10, 100).toFixed(0)}%</span>
            </div>
            <Progress value={Math.min((totalStudyTime / 3600) * 10, 100)} className="h-2" />
          </div>
        </div>

        
        <div>
          <h4 className="text-sm font-semibold mb-3">Last 7 Days</h4>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studyHistory}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cards" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Strongest Areas
            </h4>
            <div className="flex flex-wrap gap-1">
              {strongestAreas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Keep studying to identify strengths</p>
              ) : (
                strongestAreas.map(area => (
                  <Badge key={area} variant="secondary" className="bg-green-500/10 text-green-700">
                    {area}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
              Needs Practice
            </h4>
            <div className="flex flex-wrap gap-1">
              {weakestAreas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No weak areas identified</p>
              ) : (
                weakestAreas.map(area => (
                  <Badge key={area} variant="secondary" className="bg-red-500/10 text-red-700">
                    {area}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        
        <div className="flex gap-2">
          <Button className="flex-1">
            <Brain className="w-4 h-4 mr-2" />
            Start Review ({dueToday} cards)
          </Button>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Decks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}