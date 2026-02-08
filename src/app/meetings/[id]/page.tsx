'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ChatInterface, Message } from '@/components/chat/ChatInterface';
import { ChatSidebar, ChatSession } from '@/components/chat/ChatSidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CheckSquare, 
  ArrowLeft,
  Clock, 
  Users, 
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useUserId } from '@/hooks/useUserId';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TranscriptSegment = { speaker?: string; text: string; timestamp?: string };

function parseTranscript(transcript: string): TranscriptSegment[] {
  const lines = transcript.split('\n').filter(line => line.trim());
  const segments: TranscriptSegment[] = [];
  let currentSegment: TranscriptSegment = { text: '' };
  
  for (const line of lines) {
    const speakerMatch = line.match(/^(Speaker\s+\d+|[^\s:]+):\s*(.+)$/i);
    const timestampMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$/);
    
    if (speakerMatch) {
      if (currentSegment.text) segments.push({ ...currentSegment });
      currentSegment = { speaker: speakerMatch[1], text: speakerMatch[2] };
    } else if (timestampMatch) {
      if (currentSegment.text) segments.push({ ...currentSegment });
      currentSegment = { timestamp: timestampMatch[1], text: timestampMatch[2] };
    } else {
      currentSegment.text += (currentSegment.text ? ' ' : '') + line;
    }
  }
  
  if (currentSegment.text) segments.push(currentSegment);
  if (segments.length === 0) return lines.map(text => ({ text }));
  return segments;
}

export default function MeetingPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const userId = useUserId();

  const { data: result, error, isLoading } = useSWR(
    id ? `/api/meetings/${id}/status` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (!userId || !id) return;

    const loadSessions = async () => {
      try {
        const res = await fetch(`/api/meetings/${id}/chat-sessions?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to load chat sessions');
        
        const { data } = await res.json();
        if (data) {
          setSessions(data);
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
      }
    };

    loadSessions();
  }, [userId, id]);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/meetings/${id}/chat-sessions/${sessionId}?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [userId, id, currentSessionId]);

  const handleSessionCreated = useCallback((sessionId: string, title: string) => {
    const newSession: ChatSession = {
      id: sessionId,
      title: title || 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 2,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(sessionId);
  }, []);

  const meeting = result?.data;
  
  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/meetings/${id}/chat-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: newTitle }),
      });
      
      if (res.ok) {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title: newTitle } : s
        ));
      }
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  }, [userId, id]);

  const handleExportSession = useCallback(async (sessionId: string) => {
    if (!userId || !meeting) return;
    
    try {
      const res = await fetch(`/api/meetings/${id}/chat-sessions/${sessionId}?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      
      const { data } = await res.json();
      
      let content = `# ${data.title}\n\n`;
      content += `Meeting: ${meeting.title}\n`;
      content += `Exported: ${new Date().toLocaleString()}\n\n`;
      content += `---\n\n`;
      
      data.messages.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'You' : 'AI';
        const time = new Date(msg.timestamp).toLocaleString();
        content += `**${role}** (${time}):\n${msg.content}\n\n`;
      });
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export session:', err);
    }
  }, [userId, id, meeting]);

  const handleExportAll = useCallback(async () => {
    if (!userId || !meeting) return;
    
    try {
      let allContent = `# All Chat Sessions\n\n`;
      allContent += `Meeting: ${meeting.title}\n`;
      allContent += `Exported: ${new Date().toLocaleString()}\n`;
      allContent += `Total Sessions: ${sessions.length}\n\n`;
      allContent += `===================\n\n`;
      
      for (const session of sessions) {
        const res = await fetch(`/api/meetings/${id}/chat-sessions/${session.id}?userId=${userId}`);
        if (!res.ok) continue;
        
        const { data } = await res.json();
        
        allContent += `## ${session.title}\n`;
        allContent += `Date: ${new Date(session.createdAt).toLocaleString()}\n\n`;
        
        data.messages.forEach((msg: any) => {
          const role = msg.role === 'user' ? 'You' : 'AI';
          const time = new Date(msg.timestamp).toLocaleString();
          allContent += `**${role}** (${time}):\n${msg.content}\n\n`;
        });
        
        allContent += `\n---\n\n`;
      }
      
      const blob = new Blob([allContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-chats-${meeting.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export all sessions:', err);
    }
  }, [userId, id, meeting, sessions]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-14 border-b px-4 flex items-center bg-background">
          <div className="animate-pulse h-6 bg-muted rounded w-48"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse h-64 w-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !result?.success || !meeting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Failed to load meeting</p>
          <p className="text-xs text-muted-foreground mt-1">Please try again</p>
        </div>
      </div>
    );
  }

  const transcriptSegments = meeting.transcript ? parseTranscript(meeting.transcript) : [];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold truncate">{meeting.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 ml-4">
          {meeting.duration && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{Math.round(meeting.duration / 60)}m</span>
            </div>
          )}
          {meeting.speakers?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{meeting.speakers.length}</span>
            </div>
          )}
          {meeting.actionItems?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{meeting.actionItems.length}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="h-10 border-b px-4 flex items-center justify-center bg-muted/30 shrink-0">
            <TabsList className="h-8 p-1 bg-background gap-1">
              <TabsTrigger value="chat" className="h-6 px-4 text-xs gap-1.5 data-[state=active]:bg-muted rounded-md">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Chat</span>
              </TabsTrigger>
              <TabsTrigger value="transcript" className="h-6 px-4 text-xs gap-1.5 data-[state=active]:bg-muted rounded-md">
                <FileText className="h-3.5 w-3.5" />
                <span>Transcript</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="h-6 px-4 text-xs gap-1.5 data-[state=active]:bg-muted rounded-md">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Tasks</span>
                {meeting.actionItems?.length > 0 && (
                  <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {meeting.actionItems.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 m-0 overflow-hidden flex">
            <ChatSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              onExportSession={handleExportSession}
              onExportAll={handleExportAll}
              meetingTitle={meeting.title}
            />
            <div className="flex-1">
              <ChatInterface
                meeting={meeting}
                sessionId={currentSessionId}
                onSessionCreated={handleSessionCreated}
              />
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto p-6">
                {transcriptSegments.length > 0 ? (
                  <div className="space-y-6">
                    {transcriptSegments.map((segment, i) => (
                      <div key={i} className="flex gap-4">
                        {segment.speaker && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-semibold text-primary">
                            {segment.speaker.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {(segment.speaker || segment.timestamp) && (
                            <div className="flex items-center gap-2 mb-1">
                              {segment.speaker && (
                                <span className="text-xs font-medium">{segment.speaker}</span>
                              )}
                              {segment.timestamp && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {segment.timestamp}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {segment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : meeting.transcript ? (
                  <div className="space-y-4">
                    {meeting.transcript.split('\n\n').map((paragraph: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No transcript available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto p-6">
                {meeting.actionItems?.length > 0 ? (
                  <div className="space-y-3">
                    {meeting.actionItems.map((item: any) => (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div 
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors",
                            item.completed 
                              ? "bg-primary border-primary" 
                              : "border-muted-foreground/30 hover:border-primary"
                          )}
                        >
                          {item.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            item.completed && "line-through text-muted-foreground"
                          )}>
                            {item.text}
                          </p>
                          {item.assignee && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assigned to: {item.assignee}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No action items yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask the AI to extract action items from the meeting
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
