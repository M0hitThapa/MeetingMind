'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ListTodo, 
  Calendar, 
  User, 
  Tag, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { TamboComponentProps, ActionItemListData } from './types';

export function ActionItemList({ data, className }: TamboComponentProps<ActionItemListData>) {
  const { items = [], filters: initialFilters } = data;
  const [localItems, setLocalItems] = useState(items);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const handleToggle = async (id: string, completed: boolean) => {
    setLocalItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !completed } : item
    ));
    
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400 hover:bg-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400 hover:bg-orange-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 hover:bg-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-400 hover:bg-gray-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3" />;
      case 'high': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  const filteredItems = localItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignee?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    const matchesStatus = !initialFilters?.status || 
      initialFilters.status === 'all' ||
      (initialFilters.status === 'completed' && item.completed) ||
      (initialFilters.status === 'pending' && !item.completed);
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const pendingCount = filteredItems.filter(i => !i.completed).length;
  const completedCount = filteredItems.filter(i => i.completed).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Action Items
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pending
            </Badge>
          </CardTitle>
          {completedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount} completed
            </span>
          )}
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn("h-9 px-3", filterPriority && "bg-primary/10")}
            onClick={() => setFilterPriority(filterPriority ? null : 'high')}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No action items found</p>
            <p className="text-sm mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                  item.completed 
                    ? "bg-muted/30 border-muted opacity-60" 
                    : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                )}
              >
                <Checkbox 
                  checked={item.completed}
                  onCheckedChange={() => handleToggle(item.id, item.completed)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium leading-relaxed",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.text}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs font-medium", getPriorityColor(item.priority))}
                    >
                      {getPriorityIcon(item.priority)}
                      <span className={cn(getPriorityIcon(item.priority) && "ml-1")}>
                        {item.priority}
                      </span>
                    </Badge>
                    
                    {item.assignee && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <User className="w-3 h-3" />
                        {item.assignee}
                      </span>
                    )}
                    
                    {item.dueDate && (
                      <span className={cn(
                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                        new Date(item.dueDate) < new Date() && !item.completed
                          ? "bg-red-500/10 text-red-600"
                          : "text-muted-foreground"
                      )}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.dueDate)}
                      </span>
                    )}
                  </div>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}