"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoResultRenderProps {
  content: TamboThreadMessage["content"] | null;
  hasResult: boolean;
}

export interface ToolcallInfoResultProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  
  asChild?: boolean;
  
  children?: (props: ToolcallInfoResultRenderProps) => React.ReactNode;
}


export const ToolcallInfoResult = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoResultProps
>(({ asChild, children, ...props }, ref) => {
  const { associatedToolResponse } = useToolcallInfoContext();

  if (!associatedToolResponse) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="toolcall-info-result" {...props}>
      {children?.({
        content: associatedToolResponse.content,
        hasResult: !!associatedToolResponse.content,
      })}
    </Comp>
  );
});
ToolcallInfoResult.displayName = "ToolcallInfo.Result";
