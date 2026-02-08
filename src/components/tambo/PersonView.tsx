'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mic2, 
  CheckCircle, 
  ListTodo, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Mail,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, PersonViewData } from './types';

export function PersonView({ data, className }: TamboComponentProps<PersonViewData>) {
  const { person, meetingsAttended = 1 } = data;

  const getSentimentIcon = () => {
    switch (person.sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={person.avatar} alt={person.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {person.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{person.name}</CardTitle>
                {person.role && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Briefcase className="w-3 h-3" />
                    {person.role}
                  </div>
                )}
              </div>
              <Badge variant="outline" className={cn(
                person.sentiment === 'positive' ? 'bg-green-500/10 text-green-700' :
                person.sentiment === 'negative' ? 'bg-red-500/10 text-red-700' :
                'bg-gray-500/10 text-gray-700'
              )}>
                {getSentimentIcon()}
                <span className="ml-1 capitalize">{person.sentiment}</span>
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {person.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {person.email}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mic2 className="w-3 h-3" />
                {Math.round(person.speakingTime / 60)} min ({Math.round(person.percentage)}%)
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="contributions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contributions" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Key Contributions ({person.contributions.length})
              </h4>
              <div className="space-y-2">
                {person.contributions.map((contribution, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                    &ldquo;{contribution}&rdquo;
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Topics Discussed</h4>
              <div className="flex flex-wrap gap-2">
                {person.topicsDiscussed.map(topic => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="decisions" className="space-y-4 mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Decisions Owned ({person.decisionsOwned.length})
            </h4>
            {person.decisionsOwned.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No decisions owned</p>
            ) : (
              <div className="space-y-2">
                {person.decisionsOwned.map(decision => (
                  <div key={decision.id} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">{decision.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(decision.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4 mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Action Items ({person.actionItems.length})
            </h4>
            {person.actionItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No action items</p>
            ) : (
              <div className="space-y-2">
                {person.actionItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      item.completed ? "bg-green-500" : 
                      item.priority === 'urgent' ? "bg-red-500" :
                      item.priority === 'high' ? "bg-orange-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        {item.text}
                      </p>
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meetings attended</span>
            <span className="font-medium">{meetingsAttended}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}