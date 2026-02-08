import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";

interface ReasoningInfoRootContextValue {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  detailsId: string;
  isLoading: boolean | undefined;
  message: TamboThreadMessage;
  reasoning: string[];
  reasoningDurationMS: number | undefined;
  statusText: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ReasoningInfoRootContext =
  React.createContext<ReasoningInfoRootContextValue | null>(null);


export function useReasoningInfoRootContext(): ReasoningInfoRootContextValue {
  const context = React.useContext(ReasoningInfoRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: ReasoningInfoRootContext is missing. ReasoningInfo parts must be used within <ReasoningInfo.Root>",
    );
  }
  return context;
}
