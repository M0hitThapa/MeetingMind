import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useState } from "react";


export function convertContentToMarkdown(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) {
    
    
    return "";
  }
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (item?.type === "text") {
        parts.push(item.text ?? "");
      } else if (item?.type === "resource") {
        const resource = item.resource;
        const uri = resource?.uri;
        if (uri) {
          
          const displayName = resource?.name ?? uri;
          
          
          
          const encodedUri = encodeURIComponent(uri);
          parts.push(`[${displayName}](tambo-resource://${encodedUri})`);
        }
      }
    }
    return parts.join(" ");
  }
  return "";
}


export function useMergeRefs<Instance>(
  ...refs: (React.Ref<Instance> | undefined)[]
): null | React.RefCallback<Instance> {
  const cleanupRef = React.useRef<void | (() => void)>(undefined);

  const refEffect = React.useCallback((instance: Instance | null) => {
    const cleanups = refs.map((ref) => {
      if (ref == null) {
        return;
      }

      if (typeof ref === "function") {
        const refCallback = ref;
        const refCleanup: void | (() => void) = refCallback(instance);
        return typeof refCleanup === "function"
          ? refCleanup
          : () => {
              refCallback(null);
            };
      }

      (ref as React.MutableRefObject<Instance | null>).current = instance;
      return () => {
        (ref as React.MutableRefObject<Instance | null>).current = null;
      };
    });

    return () => {
      cleanups.forEach((refCleanup) => refCleanup?.());
    };
    
  }, refs);

  return React.useMemo(() => {
    if (refs.every((ref) => ref == null)) {
      return null;
    }

    return (value) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        (cleanupRef as React.MutableRefObject<void | (() => void)>).current =
          undefined;
      }

      if (value != null) {
        (cleanupRef as React.MutableRefObject<void | (() => void)>).current =
          refEffect(value);
      }
    };
    
  }, [refEffect, ...refs]);
}

export function useCanvasDetection(
  elementRef: React.RefObject<HTMLElement | null>,
) {
  const [hasCanvasSpace, setHasCanvasSpace] = useState(false);
  const [canvasIsOnLeft, setCanvasIsOnLeft] = useState(false);

  useEffect(() => {
    const checkCanvas = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setHasCanvasSpace(!!canvas);

      if (canvas && elementRef.current) {
        
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elementRef.current.getBoundingClientRect();
        setCanvasIsOnLeft(canvasRect.left < elemRect.left);
      }
    };

    
    checkCanvas();
    const timeoutId = setTimeout(checkCanvas, 100);

    
    window.addEventListener("resize", checkCanvas);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCanvas);
    };
  }, [elementRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}


export function hasRightClass(className?: string): boolean {
  return className ? /(?:^|\s)right(?:\s|$)/i.test(className) : false;
}


export function usePositioning(
  className?: string,
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
) {
  const isRightClass = hasRightClass(className);
  const isLeftPanel = !isRightClass;

  
  
  
  
  let historyPosition: "left" | "right";
  if (isRightClass) {
    historyPosition = "right";
  } else if (hasCanvasSpace && canvasIsOnLeft) {
    historyPosition = "right";
  } else {
    historyPosition = "left";
  }

  return { isLeftPanel, historyPosition };
}


export function getSafeContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string | React.ReactElement {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) return content; 
  if (Array.isArray(content)) {
    
    const parts: string[] = [];
    for (const item of content) {
      if (item?.type === "text") {
        parts.push(item.text ?? "");
      } else if (item?.type === "resource") {
        
        const uri = item.resource?.uri;
        if (uri) {
          parts.push(`@${uri}`);
        }
      }
    }
    return parts.join(" ");
  }
  
  
  return "Invalid content format"; 
}


function hasContentInItem(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const typedItem = item as {
    type?: string;
    text?: string;
    image_url?: { url?: string };
  };

  
  if (typedItem.type === "text") {
    return !!typedItem.text?.trim();
  }

  
  if (typedItem.type === "image_url") {
    return !!typedItem.image_url?.url;
  }

  return false;
}


export function checkHasContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): boolean {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (React.isValidElement(content)) return true; 
  if (Array.isArray(content)) {
    return content.some(hasContentInItem);
  }
  return false; 
}


export function getMessageImages(
  content: { type?: string; image_url?: { url?: string } }[] | undefined | null,
): string[] {
  if (!content) return [];

  return content
    .filter((item) => item?.type === "image_url" && item.image_url?.url)
    .map((item) => item.image_url!.url!);
}
