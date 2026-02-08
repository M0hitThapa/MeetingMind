'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, TodoDashboardData, Task } from './types';

export function TodoDashboard({ data, className }: TamboComponentProps<TodoDashboardData>) {
  const { tasks = [], stats, projects = [] } = data;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed' && !task.completedAt) return false;
    if (filter === 'pending' && task.completedAt) return false;
    if (filter === 'overdue' && (!task.dueDate || new Date(task.dueDate) > new Date())) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedProject && task.project !== selectedProject) return false;
    return true;
  });

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Task Dashboard
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Task
          </Button>
        </div>
        
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {projects.length > 0 && (
            <select 
              className="px-3 py-2 border rounded-md text-sm bg-background"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>

        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">To Do</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="space-y-2 mt-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task }: { task: Task }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completedAt;
  
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
      <Checkbox checked={!!task.completedAt} className="mt-1" />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium",
          task.completedAt && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {task.priority && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                task.priority === 'urgent' ? 'bg-red-500/10 text-red-700' :
                task.priority === 'high' ? 'bg-orange-500/10 text-orange-700' :
                task.priority === 'medium' ? 'bg-blue-500/10 text-blue-700' :
                'bg-gray-500/10 text-gray-700'
              )}
            >
              {task.priority}
            </Badge>
          )}
          
          {task.project && (
            <Badge variant="secondary" className="text-xs">
              {task.project}
            </Badge>
          )}
          
          {task.dueDate && (
            <span className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-red-600" : "text-muted-foreground"
            )}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
            </span>
          )}
          
          {task.estimatedHours && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.estimatedHours}h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}