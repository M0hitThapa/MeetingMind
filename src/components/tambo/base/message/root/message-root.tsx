import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { MessageRootContext } from "./message-root-context";

export type MessageRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    
    role: "user" | "assistant";
    
    message: TamboThreadMessage;
    
    isLoading?: boolean;
  }
>;


export const MessageRoot = React.forwardRef<HTMLDivElement, MessageRootProps>(
  function MessageRoot(
    { children, role, message, isLoading, asChild, ...props },
    ref,
  ) {
    const contextValue = React.useMemo(
      () => ({ role, isLoading, message }),
      [role, isLoading, message],
    );

    
    if (message.role === "tool") {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <MessageRootContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          data-slot="message-root"
          data-message-role={role}
          data-message-id={message.id}
          {...props}
        >
          {children}
        </Comp>
      </MessageRootContext.Provider>
    );
  },
);
