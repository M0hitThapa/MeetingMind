import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import { checkHasContent } from "@/lib/thread-hooks";
import * as React from "react";
import { ReasoningInfoRootContext } from "./reasoning-info-context";


export function formatReasoningDuration(durationMS: number): string {
  const seconds = Math.floor(Math.max(0, durationMS) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 1) return "Thought for less than 1 second";
  if (seconds < 60)
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes < 60)
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `Thought for ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function getStatusText(
  isLoading: boolean | undefined,
  reasoningDurationMS: number | undefined,
): string {
  if (isLoading) {
    return "Thinking";
  }
  if (reasoningDurationMS) {
    return formatReasoningDuration(reasoningDurationMS);
  }
  return "Done Thinking";
}

export interface ReasoningInfoRootProps extends React.HTMLAttributes<HTMLDivElement> {
  
  asChild?: boolean;
  
  defaultExpanded?: boolean;
  
  autoCollapse?: boolean;
  
  message: TamboThreadMessage;
  
  isLoading?: boolean;
}


export const ReasoningInfoRoot = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoRootProps
>(
  (
    {
      asChild,
      message,
      isLoading,
      defaultExpanded = true,
      autoCollapse = true,
      children,
      ...props
    },
    ref,
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const detailsId = React.useId();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const hasReasoning = !!message.reasoning?.length;
    const statusText = getStatusText(isLoading, message.reasoningDurationMS);

    const contextValue = React.useMemo(
      () => ({
        isExpanded,
        setIsExpanded,
        detailsId,
        isLoading,
        message,
        reasoning: message.reasoning ?? [],
        reasoningDurationMS: message.reasoningDurationMS,
        statusText,
        scrollContainerRef,
      }),
      [isExpanded, detailsId, isLoading, message, statusText],
    );

    
    React.useEffect(() => {
      if (autoCollapse && checkHasContent(message.content) && !isLoading) {
        setIsExpanded(false);
      }
    }, [message.content, isLoading, autoCollapse]);

    
    React.useEffect(() => {
      if (scrollContainerRef.current && isExpanded && message.reasoning) {
        const scroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        if (isLoading) {
          requestAnimationFrame(scroll);
        } else {
          const timeoutId = setTimeout(scroll, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [message.reasoning, isExpanded, isLoading]);

    
    if (!hasReasoning) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <ReasoningInfoRootContext.Provider value={contextValue}>
        <Comp ref={ref} data-slot="reasoning-info" {...props}>
          {children}
        </Comp>
      </ReasoningInfoRootContext.Provider>
    );
  },
);
ReasoningInfoRoot.displayName = "ReasoningInfo.Root";
