import { cn } from "@/lib/utils";
import {
  useCanvasDetection,
  usePositioning,
  useMergeRefs,
} from "@/lib/thread-hooks";
import * as React from "react";
import { useRef } from "react";


export interface ThreadContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  
  disableSidebarSpacing?: boolean;
}


export const ThreadContainer = React.forwardRef<
  HTMLDivElement,
  ThreadContainerProps
>(({ className, children, disableSidebarSpacing = false, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(containerRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    className,
    canvasIsOnLeft,
    hasCanvasSpace,
  );
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, containerRef);

  return (
    <div
      ref={mergedRef}
      className={cn(
        
        "flex flex-col overflow-hidden bg-background",
        "h-full",

        
        "transition-all duration-200 ease-in-out",

        
        !disableSidebarSpacing &&
          (historyPosition === "right"
            ? "mr-[var(--sidebar-width,16rem)]"
            : "ml-[var(--sidebar-width,16rem)]"),

        
        !disableSidebarSpacing &&
          (hasCanvasSpace
            ? "max-w-3xl"
            : "w-[calc(100%-var(--sidebar-width,16rem))]"),
        disableSidebarSpacing && "flex-1",

        
        hasCanvasSpace && (canvasIsOnLeft ? "border-l" : "border-r"),
        hasCanvasSpace && "border-border",

        
        !isLeftPanel && "ml-auto",

        
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ThreadContainer.displayName = "ThreadContainer";


export function useThreadContainerContext() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(containerRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    "",
    canvasIsOnLeft,
    hasCanvasSpace,
  );

  return {
    containerRef,
    hasCanvasSpace,
    canvasIsOnLeft,
    isLeftPanel,
    historyPosition,
  };
}
