'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar as CalendarIcon,
  Zap,
  Coffee,
  Users,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, TimeBlockingCalendarData } from './types';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); 

export function TimeBlockingCalendar({ data, className }: TamboComponentProps<TimeBlockingCalendarData>) {
  const { blocks = [], date, energyMap = {} } = data;
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const getBlockTypeIcon = (type: string) => {
    switch (type) {
      case 'deep_work': return <Zap className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'admin': return <Briefcase className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'deep_work': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'admin': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'break': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    }
  };

  const getEnergyColor = (energy?: string) => {
    switch (energy) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getBlocksForHour = (hour: number) => {
    return blocks.filter(block => {
      const startHour = parseInt(block.startTime.split(':')[0]);
      const endHour = parseInt(block.endTime.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Time Blocking
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <Button size="sm" variant="outline">
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          {HOURS.map(hour => {
            const hourBlocks = getBlocksForHour(hour);
            const energy = energyMap[`${hour}:00`];
            
            return (
              <div 
                key={hour} 
                className="flex items-stretch gap-2 min-h-15"
              >
                <div className="w-16 shrink-0 text-right pr-2 py-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                  {energy && (
                    <div className={cn("w-2 h-2 rounded-full ml-auto mt-1", getEnergyColor(energy))} />
                  )}
                </div>
                
                <div className="flex-1 border-t border-border relative">
                  {hourBlocks.map(block => (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute inset-x-0 m-1 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        getBlockTypeColor(block.type),
                        selectedBlock === block.id && "ring-2 ring-primary"
                      )}
                      style={{
                        top: 0,
                        height: 'calc(100% - 8px)'
                      }}
                      onClick={() => setSelectedBlock(block.id === selectedBlock ? null : block.id)}
                    >
                      <div className="flex items-center gap-1.5">
                        {getBlockTypeIcon(block.type)}
                        <span className="text-xs font-medium truncate">{block.title}</span>
                      </div>
                      {block.tasks && block.tasks.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {block.tasks.map((task, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        
        <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4">
          {[
            { type: 'deep_work', label: 'Deep Work', color: 'bg-purple-500' },
            { type: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
            { type: 'admin', label: 'Admin', color: 'bg-gray-500' },
            { type: 'break', label: 'Break', color: 'bg-green-500' },
            { type: 'task', label: 'Task', color: 'bg-orange-500' },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-1.5 text-xs">
              <div className={cn("w-3 h-3 rounded", item.color)} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}