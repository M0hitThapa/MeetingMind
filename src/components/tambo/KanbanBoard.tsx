'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Tag,
  Plus,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, KanbanBoardData, KanbanTask } from './types';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500/10' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500/10' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500/10' },
  { id: 'done', title: 'Done', color: 'bg-green-500/10' },
] as const;

export function KanbanBoard({ data, className }: TamboComponentProps<KanbanBoardData>) {
  const { tasks = [] } = data;
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getColumnTasks = (status: string) => 
    tasks.filter(t => t.status === status);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          Kanban Board
        </CardTitle>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(column => {
            const columnTasks = getColumnTasks(column.id);
            return (
              <div 
                key={column.id} 
                className={cn(
                  "p-3 rounded-lg min-h-[200px]",
                  column.color
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{column.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {columnTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-move group"
                      draggable
                      onDragStart={() => setDraggedTask(task.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Move</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getPriorityColor(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                        
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {task.assignee && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </div>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map(tag => (
                            <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
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
      </CardContent>
    </Card>
  );
}