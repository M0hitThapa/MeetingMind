'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, UserX, Trash2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, PriorityMatrixData } from './types';

export function PriorityMatrix({ data, className }: TamboComponentProps<PriorityMatrixData>) {
  const { quadrants } = data;

  const quadrantConfig = {
    q1: { 
      title: 'Do First', 
      subtitle: 'Urgent & Important',
      icon: AlertCircle,
      color: 'bg-red-500/5 border-red-500/20',
      headerColor: 'text-red-600',
      badgeColor: 'bg-red-500/10 text-red-700 border-red-500/20'
    },
    q2: { 
      title: 'Schedule', 
      subtitle: 'Not Urgent & Important',
      icon: Calendar,
      color: 'bg-blue-500/5 border-blue-500/20',
      headerColor: 'text-blue-600',
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    },
    q3: { 
      title: 'Delegate', 
      subtitle: 'Urgent & Not Important',
      icon: UserX,
      color: 'bg-yellow-500/5 border-yellow-500/20',
      headerColor: 'text-yellow-600',
      badgeColor: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
    },
    q4: { 
      title: 'Eliminate', 
      subtitle: 'Not Urgent & Not Important',
      icon: Trash2,
      color: 'bg-gray-500/5 border-gray-500/20',
      headerColor: 'text-gray-600',
      badgeColor: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    },
  } as const;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Priority Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(quadrantConfig) as Array<keyof typeof quadrantConfig>).map((key) => {
            const config = quadrantConfig[key];
            const items = quadrants[key] || [];
            const Icon = config.icon;
            
            return (
              <div 
                key={key} 
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  config.color
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", config.headerColor)} />
                      <h4 className={cn("font-semibold", config.headerColor)}>
                        {config.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {config.subtitle}
                    </p>
                  </div>
                  <Badge variant="outline" className={config.badgeColor}>
                    {items.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 min-h-[100px]">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No items
                    </p>
                  ) : (
                    items.map(item => (
                      <div 
                        key={item.id} 
                        className="p-2.5 bg-card rounded border shadow-sm text-sm hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <p className="font-medium line-clamp-2">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="outline" className="text-xs">
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20" />
            <span>High Urgency</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-500/20" />
            <span>Low Urgency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import { ArrowRight } from 'lucide-react';