import type { TamboThreadMessage } from "@tambo-ai/react";
import { getToolCallRequest } from "./get-tool-call-request";


export function getToolStatusMessage(
  message: TamboThreadMessage,
  isLoading: boolean | undefined,
): string | null {
  if (message.role !== "assistant" || !getToolCallRequest(message)) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${getToolCallRequest(message)?.toolName ?? "tool"}`
    : `Called ${getToolCallRequest(message)?.toolName ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? message.component?.statusMessage
    : message.component?.completionStatusMessage;
  return toolStatusMessage ?? toolCallMessage;
}
