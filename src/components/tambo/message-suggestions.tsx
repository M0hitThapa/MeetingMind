"use client";

import { MessageGenerationStage } from "./message-generation-stage";
import { Tooltip, TooltipProvider } from "./suggestions-tooltip";
import { cn } from "@/lib/utils";
import type { Suggestion, TamboThread } from "@tambo-ai/react";
import {
  GenerationStage,
  useTambo,
  useTamboSuggestions,
} from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";


interface MessageSuggestionsContextValue {
  suggestions: Suggestion[];
  selectedSuggestionId: string | null;
  accept: (options: { suggestion: Suggestion }) => Promise<void>;
  isGenerating: boolean;
  error: Error | null;
  thread: TamboThread;
  isMac: boolean;
}


const MessageSuggestionsContext =
  React.createContext<MessageSuggestionsContextValue | null>(null);


const useMessageSuggestionsContext = () => {
  const context = React.useContext(MessageSuggestionsContext);
  if (!context) {
    throw new Error(
      "MessageSuggestions sub-components must be used within a MessageSuggestions",
    );
  }
  return context;
};


export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  
  maxSuggestions?: number;
  
  children?: React.ReactNode;
  
  initialSuggestions?: Suggestion[];
}


const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(
  (
    {
      children,
      className,
      maxSuggestions = 3,
      initialSuggestions = [],
      ...props
    },
    ref,
  ) => {
    const { thread } = useTambo();
    const {
      suggestions: generatedSuggestions,
      selectedSuggestionId,
      accept,
      generateResult: { isPending: isGenerating, error },
    } = useTamboSuggestions({ maxSuggestions });

    
    const suggestions = React.useMemo(() => {
      
      if (!thread?.messages?.length && initialSuggestions.length > 0) {
        return initialSuggestions.slice(0, maxSuggestions);
      }
      
      return generatedSuggestions;
    }, [
      thread?.messages?.length,
      generatedSuggestions,
      initialSuggestions,
      maxSuggestions,
    ]);

    const isMac =
      typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

    
    const lastAiMessageIdRef = useRef<string | null>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const contextValue = React.useMemo(
      () => ({
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      }),
      [
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      ],
    );

    
    const lastAiMessage = thread?.messages
      ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
      : null;

    
    useEffect(() => {
      if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
        lastAiMessageIdRef.current = lastAiMessage.id;

        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = setTimeout(() => {}, 5000);
      }

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }, [lastAiMessage, suggestions.length]);

    
    useEffect(() => {
      if (!suggestions || suggestions.length === 0) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        const modifierPressed = isMac
          ? event.metaKey && event.altKey
          : event.ctrlKey && event.altKey;

        if (modifierPressed) {
          const keyNum = parseInt(event.key);
          if (!isNaN(keyNum) && keyNum > 0 && keyNum <= suggestions.length) {
            event.preventDefault();
            const suggestionIndex = keyNum - 1;
            void accept({ suggestion: suggestions[suggestionIndex] });
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [suggestions, accept, isMac]);

    
    if (!thread?.messages?.length && initialSuggestions.length === 0) {
      return null;
    }

    return (
      <MessageSuggestionsContext.Provider value={contextValue}>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn("px-4 pb-2", className)}
            data-slot="message-suggestions-container"
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </MessageSuggestionsContext.Provider>
    );
  },
);
MessageSuggestions.displayName = "MessageSuggestions";


export type MessageSuggestionsStatusProps =
  React.HTMLAttributes<HTMLDivElement>;


const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsStatusProps
>(({ className, ...props }, ref) => {
  const { error, isGenerating, thread } = useMessageSuggestionsContext();

  return (
    <div
      ref={ref}
      className={cn(
        "p-2 rounded-md text-sm bg-transparent",
        !error &&
          !isGenerating &&
          (!thread?.generationStage ||
            thread.generationStage === GenerationStage.COMPLETE)
          ? "p-0 min-h-0 mb-0"
          : "",
        className,
      )}
      data-slot="message-suggestions-status"
      {...props}
    >
      
      {error && (
        <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
          <p>{error.message}</p>
        </div>
      )}

      
      <div className="generation-stage-container">
        <GenerationStageContent
          generationStage={thread?.generationStage}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
});
MessageSuggestionsStatus.displayName = "MessageSuggestions.Status";


function GenerationStageContent({
  generationStage,
  isGenerating,
}: {
  generationStage?: string;
  isGenerating: boolean;
}) {
  if (generationStage && generationStage !== GenerationStage.COMPLETE) {
    return <MessageGenerationStage />;
  }
  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        <p>Generating suggestions...</p>
      </div>
    );
  }
  return null;
}


export type MessageSuggestionsListProps = React.HTMLAttributes<HTMLDivElement>;


const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsListProps
>(({ className, ...props }, ref) => {
  const { suggestions, selectedSuggestionId, accept, isGenerating, isMac } =
    useMessageSuggestionsContext();

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  
  const placeholders = Array(3).fill(null);

  return (
    <div
      ref={ref}
      className={cn(
        "flex space-x-2 overflow-x-auto pb-2 rounded-md bg-transparent min-h-[2.5rem]",
        isGenerating ? "opacity-70" : "",
        className,
      )}
      data-slot="message-suggestions-list"
      {...props}
    >
      {suggestions.length > 0
        ? suggestions.map((suggestion, index) => (
            <Tooltip
              key={suggestion.id}
              content={
                <span suppressHydrationWarning>
                  {modKey}+{altKey}+{index + 1}
                </span>
              }
              side="top"
            >
              <button
                className={cn(
                  "py-2 px-2.5 rounded-2xl text-xs transition-colors",
                  "border border-flat",
                  getSuggestionButtonClassName({
                    isGenerating,
                    isSelected: selectedSuggestionId === suggestion.id,
                  }),
                )}
                onClick={async () =>
                  !isGenerating && (await accept({ suggestion }))
                }
                disabled={isGenerating}
                data-suggestion-id={suggestion.id}
                data-suggestion-index={index}
              >
                <span className="font-medium">{suggestion.title}</span>
              </button>
            </Tooltip>
          ))
        : 
          placeholders.map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className="py-2 px-2.5 rounded-2xl text-xs border border-flat bg-muted/20 text-transparent animate-pulse"
              data-placeholder-index={index}
            >
              <span className="invisible">Placeholder</span>
            </div>
          ))}
    </div>
  );
});
MessageSuggestionsList.displayName = "MessageSuggestions.List";


function getSuggestionButtonClassName({
  isGenerating,
  isSelected,
}: {
  isGenerating: boolean;
  isSelected: boolean;
}) {
  if (isGenerating) {
    return "bg-muted/50 text-muted-foreground";
  }
  if (isSelected) {
    return "bg-accent text-accent-foreground";
  }
  return "bg-background hover:bg-accent hover:text-accent-foreground";
}

export {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
  Tooltip,
  TooltipProvider,
};
