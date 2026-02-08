'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Meeting, ComponentType } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserId } from '@/hooks/useUserId';
import { DynamicComponentRenderer } from '@/components/tambo/DynamicComponentRenderer';

export interface GeneratedComponent {
  id: string;
  type: string;
  data: unknown;
  title?: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  components?: GeneratedComponent[];
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  meeting: Meeting;
  sessionId: string | null;
  onSessionCreated?: (sessionId: string, title: string) => void;
}

interface APIResponse {
  answer?: string;
  components?: Array<{
    type: string;
    data: unknown;
    title?: string;
  }>;
}

export function ChatInterface({ meeting, sessionId, onSessionCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useUserId();
  const currentSessionIdRef = useRef<string | null>(sessionId);

  useEffect(() => {
    currentSessionIdRef.current = sessionId;
  }, [sessionId]);

  const defaultSuggestions = [
    { id: 'summary', title: 'Summarize this meeting', prompt: `Summarize the meeting "${meeting.title}"` },
    { id: 'decisions', title: 'What decisions were made?', prompt: `What decisions were made in "${meeting.title}"?` },
    { id: 'action-items', title: 'List action items', prompt: `List action items from "${meeting.title}"` },
    { id: 'speakers', title: 'Show speaker analytics', prompt: `Show speaker analytics for "${meeting.title}"` },
    { id: 'topics', title: 'What topics were discussed?', prompt: `What topics were discussed in "${meeting.title}"?` },
    { id: 'sentiment', title: 'Analyze sentiment', prompt: `Analyze the sentiment of "${meeting.title}"` },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!userId || !sessionId) {
      setMessages([]);
      return;
    }

    const loadChatSession = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/meetings/${meeting.id}/chat-sessions/${sessionId}?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to load chat session');
        
        const { data } = await res.json();
        if (data && data.messages && data.messages.length > 0) {
          const parsedMessages = data.messages.map((msg: Message) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
            components: msg.components?.map((comp: GeneratedComponent) => ({
              ...comp,
              timestamp: typeof comp.timestamp === 'string' ? new Date(comp.timestamp) : comp.timestamp,
            })),
          }));
          setMessages(parsedMessages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load chat session:', err);
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatSession();
  }, [userId, meeting.id, sessionId]);

  const streamText = useCallback((text: string, messageId: string) => {
    const words = text.split(' ');
    let currentWord = 0;
    
    const interval = setInterval(() => {
      if (currentWord >= words.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isStreaming: false } : msg
        ));
        return;
      }
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const displayedWords = words.slice(0, currentWord + 1).join(' ');
          return { ...msg, content: displayedWords };
        }
        return msg;
      }));
      
      currentWord++;
    }, 30);

    return interval;
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;
    if (trimmedContent.length > 2000) {
      console.error('Message too long');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/meetings/${meeting.id}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: trimmedContent, 
          voiceInput: false,
          ...(userId && { userId }),
          ...(currentSessionIdRef.current && { sessionId: currentSessionIdRef.current }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result = await res.json() as { data: APIResponse; sessionId?: string };
      
      if (result.sessionId && !currentSessionIdRef.current) {
        onSessionCreated?.(result.sessionId, content.slice(0, 50));
        currentSessionIdRef.current = result.sessionId;
      }
      
      const { data } = result;
      
      let filteredComponents = data.components || [];
      const nonStatsComponents = filteredComponents.filter((c) => c.type !== 'quick_stats');
      if (nonStatsComponents.length > 0) {
        filteredComponents = nonStatsComponents;
      }

      const mappedComponents = filteredComponents.map((comp, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        type: comp.type,
        data: comp.data,
        title: comp.title || comp.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        timestamp: new Date(),
      }));

      const assistantMessageId = (Date.now() + 1).toString();
      const fullContent = data.answer || "Here's what I found:";

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        components: mappedComponents,
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      streamText(fullContent, assistantMessageId);
      
    } catch (err) {
      console.error('Query error:', err);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [meeting.id, isLoading, userId, streamText, onSessionCreated]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-center">Ask about this meeting</h1>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                Get insights, summaries, action items, and visual analytics powered by AI
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {defaultSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSendMessage(s.prompt)}
                    className="px-4 py-2 text-sm border rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-32">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "py-6 px-4",
                    message.role === 'assistant' ? "bg-muted/30" : "bg-background"
                  )}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-green-500 text-white"
                    )}>
                      {message.role === 'user' ? 'You' : 'AI'}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-4">
                      {message.content && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                            )}
                          </p>
                        </div>
                      )}
                      
                      {message.components && message.components.length > 0 && (
                        <div className="space-y-4 mt-4">
                          {message.components.map((component) => (
                            <div 
                              key={component.id}
                              className="bg-card border rounded-lg overflow-hidden shadow-sm"
                            >
                              <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {component.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(component.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              <div className="p-4">
                                <DynamicComponentRenderer
                                  config={{
                                    type: component.type as ComponentType,
                                    data: component.data,
                                    layout: 'full',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="py-6 px-4 bg-muted/30">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-muted-foreground">Analyzing with AI...</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Ask about this meeting..."
              className="w-full min-h-[56px] max-h-[200px] resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isLoading}
              rows={1}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 h-8 w-8 p-0"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
