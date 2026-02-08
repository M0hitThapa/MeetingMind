"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { getToolCallRequest } from "./get-tool-call-request";
import { getToolStatusMessage } from "./get-tool-status-message";
import { ToolcallInfoContext } from "./toolcall-info-context";

export type ToolcallInfoRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    
    defaultExpanded?: boolean;
    
    isLoading?: boolean;
    
    message: TamboThreadMessage;
  }
>;


export const ToolcallInfoRoot = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoRootProps
>(
  (
    {
      asChild,
      message,
      isLoading,
      defaultExpanded = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const { thread } = useTambo();
    const detailsId = React.useId();

    const associatedToolResponse = React.useMemo(() => {
      if (!thread?.messages) return null;
      const currentMessageIndex = thread.messages.findIndex(
        (m: TamboThreadMessage) => m.id === message.id,
      );
      if (currentMessageIndex === -1) return null;
      for (let i = currentMessageIndex + 1; i < thread.messages.length; i++) {
        const nextMessage = thread.messages[i];
        if (nextMessage.role === "tool") {
          return nextMessage;
        }
        if (
          nextMessage.role === "assistant" &&
          getToolCallRequest(nextMessage)
        ) {
          break;
        }
      }
      return null;
    }, [message, thread?.messages]);

    const toolCallRequest = getToolCallRequest(message);
    const isToolCallMessage = message.role === "assistant" && !!toolCallRequest;
    const hasToolError = !!message.error;
    
    
    const toolStatusMessage = getToolStatusMessage(message, isLoading) ?? "";

    const contextValue = React.useMemo(
      () => ({
        isExpanded,
        setIsExpanded,
        toolCallRequest,
        hasToolError,
        toolStatusMessage,
        associatedToolResponse,
        detailsId,
        isLoading,
        message,
      }),
      [
        isExpanded,
        toolCallRequest,
        hasToolError,
        toolStatusMessage,
        associatedToolResponse,
        detailsId,
        isLoading,
        message,
      ],
    );

    if (!isToolCallMessage) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <ToolcallInfoContext.Provider value={contextValue}>
        <Comp ref={ref} data-slot="toolcall-info" {...props}>
          {children}
        </Comp>
      </ToolcallInfoContext.Provider>
    );
  },
);
ToolcallInfoRoot.displayName = "ToolcallInfo.Root";
