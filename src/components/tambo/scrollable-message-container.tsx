"use client";

import { GenerationStage, useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";


export type ScrollableMessageContainerProps =
  React.HTMLAttributes<HTMLDivElement>;


export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();
  const [shouldAutoscroll, setShouldAutoscroll] = useState(true);
  const lastScrollTopRef = useRef(0);

  
  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  
  const messagesContent = useMemo(() => {
    if (!thread.messages) return null;

    return thread.messages.map((message) => ({
      id: message.id,
      content: message.content,
      tool_calls: message.tool_calls,
      component: message.component,
      reasoning: message.reasoning,
      componentState: message.componentState,
    }));
  }, [thread.messages]);

  const generationStage = useMemo(
    () => thread?.generationStage ?? GenerationStage.IDLE,
    [thread?.generationStage],
  );

  
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8; 

    
    if (scrollTop < lastScrollTopRef.current) {
      setShouldAutoscroll(false);
    }
    
    else if (isAtBottom) {
      setShouldAutoscroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  
  useEffect(() => {
    if (scrollContainerRef.current && messagesContent && shouldAutoscroll) {
      const scroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      };

      if (generationStage === GenerationStage.STREAMING_RESPONSE) {
        
        requestAnimationFrame(scroll);
      } else {
        
        const timeoutId = setTimeout(scroll, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messagesContent, generationStage, shouldAutoscroll]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto",
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
        "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        className,
      )}
      data-slot="scrollable-message-container"
      {...props}
    >
      {children}
    </div>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";
