"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoStatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  
  asChild?: boolean;
}


export const ToolcallInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusTextProps
>(({ asChild, children, ...props }, ref) => {
  const { toolStatusMessage } = useToolcallInfoContext();

  const Comp = asChild ? Slot : "span";

  return (
    <Comp ref={ref} data-slot="toolcall-info-status-text" {...props}>
      {children ?? toolStatusMessage}
    </Comp>
  );
});
ToolcallInfoStatusText.displayName = "ToolcallInfo.StatusText";
