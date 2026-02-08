"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import * as React from "react";




const looksLikeCode = (text: string): boolean => {
  const codeIndicators = [
    /^import\s+/m,
    /^function\s+/m,
    /^class\s+/m,
    /^const\s+/m,
    /^let\s+/m,
    /^var\s+/m,
    /[{}[\]();]/,
    /^\s*\/\//m,
    /^\s*\/\*/m,
    /=>/,
    /^export\s+/m,
  ];
  return codeIndicators.some((pattern) => pattern.test(text));
};


function ResourceMention({ name, uri }: { name: string; uri: string }) {
  return (
    <span
      className="mention resource inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground cursor-default"
      data-resource-uri={uri}
      title={uri}
    >
      @{name}
    </span>
  );
}


const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async () => {
    if (!code) return;

    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
    } catch (err) {
      console.error("Failed to copy code to clipboard:", err);
      setError(true);
    }
    timeoutRef.current = setTimeout(() => setError(false), 2000);
  };

  const Icon = React.useMemo(() => {
    if (error) {
      return <X className="size-4 text-red-500" />;
    }
    if (copied) {
      return <Check className="size-4 text-green-500" />;
    }
    return <Copy className="size-4" />;
  }, [copied, error]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-md bg-container px-4 py-2 text-sm font-semibold text-foreground">
      <span className="lowercase text-muted-foreground">{language}</span>
      <button
        onClick={copyToClipboard}
        className="p-1 rounded-md hover:bg-backdrop transition-colors cursor-pointer"
        title={error ? "Failed to copy" : "Copy code"}
      >
        {Icon}
      </button>
    </div>
  );
};


export const createMarkdownComponents = (): Record<
  string,
  
  React.ComponentType<any>
> => ({
  code: function Code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const content = String(children).replace(/\n$/, "");
    const deferredContent = React.useDeferredValue(content);

    const highlighted = React.useMemo(() => {
      if (!match || !looksLikeCode(deferredContent)) return null;
      try {
        return hljs.highlight(deferredContent, { language: match[1] }).value;
      } catch {
        return deferredContent;
      }
    }, [deferredContent, match]);

    if (match && looksLikeCode(content)) {
      return (
        <div className="relative border border-border rounded-md bg-muted max-w-[80ch] text-sm my-4">
          <CodeHeader language={match[1]} code={content} />
          <div
            className={cn(
              "overflow-x-auto rounded-b-md bg-background",
              "[&::-webkit-scrollbar]:w-[6px]",
              "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-md",
              "[&::-webkit-scrollbar:horizontal]:h-[4px]",
            )}
          >
            <pre className="p-4 whitespace-pre">
              <code
                className={className}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(highlighted ?? content),
                }}
              />
            </pre>
          </div>
        </div>
      );
    }

    return (
      <code
        className={cn("bg-muted px-1.5 py-0.5 rounded text-sm", className)}
        {...props}
      >
        {children}
      </code>
    );
  },

  
  p: ({ children }) => <p className="my-0">{children}</p>,

  
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
  ),

  
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
  ),

  
  h3: ({ children }) => (
    <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
  ),

  
  h4: ({ children }) => (
    <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>
  ),

  
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,

  
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,

  
  li: ({ children }) => <li className="leading-normal">{children}</li>,

  
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted pl-4 italic my-4">
      {children}
    </blockquote>
  ),

  
  a: ({ href, children }) => {
    
    if (href?.startsWith("tambo-resource://")) {
      
      const encodedUri = href.slice("tambo-resource://".length);
      
      let uri: string;
      try {
        uri = decodeURIComponent(encodedUri);
      } catch {
        
        uri = encodedUri;
      }
      
      
      let name: string;
      if (typeof children === "string") {
        name = children;
      } else if (typeof children === "number") {
        name = String(children);
      } else if (Array.isArray(children)) {
        
        name = children
          .map((child) =>
            typeof child === "string" ? child : String(child ?? ""),
          )
          .join("");
      } else {
        name = String(children ?? uri);
      }
      return <ResourceMention name={name || uri} uri={uri} />;
    }

    
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-foreground underline underline-offset-4 decoration-muted-foreground hover:text-foreground hover:decoration-foreground transition-colors"
      >
        <span>{children}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  },

  
  hr: () => <hr className="my-4 border-muted" />,

  
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-border">{children}</table>
    </div>
  ),

  
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold">
      {children}
    </th>
  ),

  
  td: ({ children }) => (
    <td className="border border-border px-4 py-2">{children}</td>
  ),
});


export const markdownComponents = createMarkdownComponents();
