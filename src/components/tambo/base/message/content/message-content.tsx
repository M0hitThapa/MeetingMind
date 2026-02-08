import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import {
  checkHasContent,
  convertContentToMarkdown,
} from "@/lib/thread-hooks";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageRootContext } from "../root/message-root-context";


export interface MessageContentRenderProps {
  
  content: unknown;
  
  markdownContent: string;
  
  markdown: boolean;
  
  isLoading: boolean;
  
  isCancelled: boolean;
  
  isReasoning: boolean;
}

export interface MessageContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content" | "children"
> {
  
  content?: string | TamboThreadMessage["content"];
  
  markdown?: boolean;
}


export const MessageContent = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    MessageContentProps,
    MessageContentRenderProps
  >
>(({ content: contentProp, markdown = true, asChild, ...props }, ref) => {
  const { message, isLoading } = useMessageRootContext();
  const contentToRender = contentProp ?? message.content;

  const markdownContent = React.useMemo(
    () => convertContentToMarkdown(contentToRender),
    [contentToRender],
  );

  const hasContent = React.useMemo(
    () => checkHasContent(contentToRender),
    [contentToRender],
  );

  const showLoading = !!isLoading && !hasContent && !message.reasoning;

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    content: contentToRender,
    markdownContent,
    markdown,
    isLoading: showLoading,
    isCancelled: !!message.isCancelled,
    isReasoning: !!message.reasoning,
  });

  return (
    <Comp
      ref={ref}
      data-slot="message-content"
      data-loading={showLoading || undefined}
      data-has-content={hasContent || undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
MessageContent.displayName = "Message.Content";
