import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";


export function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}
