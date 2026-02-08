import { TamboThreadMessage } from "@tambo-ai/react";
import React from "react";


interface MessageRootContextValue {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  isLoading?: boolean;
}

const MessageRootContext = React.createContext<MessageRootContextValue | null>(
  null,
);


function useMessageRootContext(): MessageRootContextValue {
  const context = React.useContext(MessageRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageRootContext is missing. Message parts must be used within <Message.Root>",
    );
  }
  return context;
}

export { MessageRootContext, useMessageRootContext };
