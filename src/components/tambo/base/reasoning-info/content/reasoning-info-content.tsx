import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useReasoningInfoRootContext } from "../root/reasoning-info-context";

export type ReasoningInfoContentProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    
    forceMount?: boolean;
  }
>;


export const ReasoningInfoContent = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoContentProps
>(({ asChild, forceMount, children, ...props }, ref) => {
  const { isExpanded, detailsId, scrollContainerRef } =
    useReasoningInfoRootContext();

  
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (
        scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
      ).current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, scrollContainerRef],
  );

  if (!forceMount && !isExpanded) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={combinedRef}
      id={detailsId}
      data-slot="reasoning-info-content"
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
ReasoningInfoContent.displayName = "ReasoningInfo.Content";
