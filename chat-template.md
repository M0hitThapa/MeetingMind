/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  // Add more tools here
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Add more components here
];     import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useState } from "react";

/**
 * Merges multiple refs into a single callback ref.
 *
 * In React 19, callback refs may return cleanup functions; this hook fans out
 * both assignments and cleanups to all provided refs and tracks the last
 * cleanup so it runs when the instance changes.
 */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refEffect, ...refs]);
}
/**
 * Custom hook to detect canvas space presence and position
 * @param elementRef - Reference to the component to compare position with
 * @returns Object containing hasCanvasSpace and canvasIsOnLeft
 */
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
        // Check if canvas appears before this component in the DOM
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elementRef.current.getBoundingClientRect();
        setCanvasIsOnLeft(canvasRect.left < elemRect.left);
      }
    };

    // Check on mount and after a short delay to ensure DOM is fully rendered
    checkCanvas();
    const timeoutId = setTimeout(checkCanvas, 100);

    // Re-check on window resize
    window.addEventListener("resize", checkCanvas);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCanvas);
    };
  }, [elementRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}

/**
 * Utility to check if a className string contains the "right" class
 * @param className - The className string to check
 * @returns true if the className contains "right", false otherwise
 */
export function hasRightClass(className?: string): boolean {
  return className ? /(?:^|\s)right(?:\s|$)/i.test(className) : false;
}

/**
 * Hook to calculate sidebar and history positions based on className and canvas position
 * @param className - Component's className string
 * @param canvasIsOnLeft - Whether the canvas is on the left
 * @returns Object with isLeftPanel and historyPosition values
 */
export function usePositioning(
  className?: string,
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
) {
  const isRightClass = hasRightClass(className);
  const isLeftPanel = !isRightClass;

  // Determine history position
  // If panel has right class, history should be on right
  // If canvas is on left, history should be on right
  // Otherwise, history should be on left
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

/**
 * Converts message content into a safely renderable format.
 * Handles text, resource references, and other content types.
 *
 * @deprecated This function is deprecated. Message rendering now uses a private
 * `convertContentToMarkdown()` function within the message component. This function
 * is kept for backward compatibility since it's exposed in the SDK.
 *
 * @param content - The message content (string, element, array, etc.)
 * @returns A renderable string or React element.
 */
export function getSafeContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string | React.ReactElement {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) return content; // Pass elements through
  if (Array.isArray(content)) {
    // Map content parts to strings, including resource references
    const parts: string[] = [];
    for (const item of content) {
      if (item?.type === "text") {
        parts.push(item.text ?? "");
      } else if (item?.type === "resource") {
        // Format resource references as @uri (uri already contains serverKey prefix if applicable)
        const uri = item.resource?.uri;
        if (uri) {
          parts.push(`@${uri}`);
        }
      }
    }
    return parts.join(" ");
  }
  // Handle potential edge cases or unknown types
  // console.warn("getSafeContent encountered unknown content type:", content);
  return "Invalid content format"; // Or handle differently
}

/**
 * Checks if a content item has meaningful data.
 * @param item - A content item from the message
 * @returns True if the item has content, false otherwise.
 */
function hasContentInItem(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const typedItem = item as {
    type?: string;
    text?: string;
    image_url?: { url?: string };
  };

  // Check for text content
  if (typedItem.type === "text") {
    return !!typedItem.text?.trim();
  }

  // Check for image content
  if (typedItem.type === "image_url") {
    return !!typedItem.image_url?.url;
  }

  return false;
}

/**
 * Checks if message content contains meaningful, non-empty text or images.
 * @param content - The message content (string, element, array, etc.)
 * @returns True if there is content, false otherwise.
 */
export function checkHasContent(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): boolean {
  if (!content) return false;
  if (typeof content === "string") return content.trim().length > 0;
  if (React.isValidElement(content)) return true; // Assume elements have content
  if (Array.isArray(content)) {
    return content.some(hasContentInItem);
  }
  return false; // Default for unknown types
}

/**
 * Extracts image URLs from message content array.
 * @param content - Array of content items
 * @returns Array of image URLs
 */
export function getMessageImages(
  content: { type?: string; image_url?: { url?: string } }[] | undefined | null,
): string[] {
  if (!content) return [];

  return content
    .filter((item) => item?.type === "image_url" && item.image_url?.url)
    .map((item) => item.image_url!.url!);
}        "use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";
import { Check } from "lucide-react";

// Define option type for individual options in the multi-select
export type DataCardItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
  url?: string;
};

// Define the component state type
export type DataCardState = {
  selectedValues: string[];
};

// Define the component props schema with Zod
export const dataCardSchema = z.object({
  title: z.string().describe("Title displayed above the data cards"),
  options: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for this card"),
        label: z.string().describe("Display text for the card title"),
        value: z.string().describe("Value associated with this card"),
        description: z
          .string()
          .optional()
          .describe("Optional summary for the card"),
        url: z
          .string()
          .optional()
          .describe("Optional URL for the card to navigate to"),
      }),
    )
    .describe("Array of selectable cards to display"),
});

// Define the props type based on the Zod schema
export type DataCardProps = z.infer<typeof dataCardSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * DataCard Component
 *
 * A component that displays options as clickable cards with links and summaries
 * with the ability to select multiple items.
 */
export const DataCard = React.forwardRef<HTMLDivElement, DataCardProps>(
  ({ title, options, className, ...props }, ref) => {
    // Initialize Tambo component state
    const [state, setState] = useTamboComponentState<DataCardState>(
      `data-card`,
      { selectedValues: [] },
    );

    // Handle option selection
    const handleToggleCard = (value: string) => {
      if (!state) return;

      const selectedValues = [...state.selectedValues];
      const index = selectedValues.indexOf(value);

      // Toggle selection
      if (index > -1) {
        // Remove if already selected
        selectedValues.splice(index, 1);
      } else {
        selectedValues.push(value);
      }

      // Update component state
      setState({ selectedValues });
    };

    // Handle navigation to URL
    const handleNavigate = (url?: string) => {
      if (url) {
        window.open(url, "_blank");
      }
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {title && (
          <h2 className="text-lg font-medium text-gray-700 mb-3">{title}</h2>
        )}

        <div className="space-y-2">
          {options?.map((card, index) => (
            <div
              key={`${card.id || "card"}-${index}`}
              className="border-b border-gray-100 pb-2 last:border-0"
            >
              <div
                className={cn(
                  "group flex items-start p-1.5 rounded-md transition-colors",
                  state &&
                    state.selectedValues.includes(card.value) &&
                    "bg-gray-50",
                )}
              >
                <div
                  className="flex-shrink-0 mr-3 mt-0.5 cursor-pointer"
                  onClick={() => handleToggleCard(card.value)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors",
                      state && state.selectedValues.includes(card.value)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {state && state.selectedValues.includes(card.value) && (
                      <Check className="h-2.5 w-2.5" />
                    )}
                  </div>
                </div>
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    card.url
                      ? handleNavigate(card.url)
                      : handleToggleCard(card.value)
                  }
                >
                  <h3
                    className={cn(
                      "text-blue-600 font-medium text-sm",
                      "group-hover:text-blue-700",
                      state &&
                        state.selectedValues.includes(card.value) &&
                        "text-blue-700",
                    )}
                  >
                    {card.label}
                  </h3>
                  {card.description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {card.description}
                    </p>
                  )}
                  {card.url && (
                    <span className="text-xs text-green-600 mt-1 block truncate opacity-80">
                      {card.url}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

DataCard.displayName = "DataCard";

export default DataCard;             "use client";

import { useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const ApiKeyMissingAlert = () => (
  <div className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
    <p className="mb-3">To get started, you need to initialize Tambo:</p>
    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded mb-3">
      <code className="text-sm flex-grow">npx tambo init</code>
      <CopyButton text="npx tambo init" />
    </div>
    <p className="text-sm">
      Or visit{" "}
      <a
        href="https://tambo.co/cli-auth"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-yellow-900"
      >
        tambo.co/cli-auth
      </a>{" "}
      to get your API key and set it in{" "}
      <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code>
    </p>
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded transition-colors relative group"
      title="Copy to clipboard"
    >
      {showCopied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        {showCopied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
};

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <div className="flex items-start gap-4">
      <div className="flex-grow">
        <div className="flex items-center gap-1">
          <div className="min-w-6">{isApiKeyMissing ? "❌" : "✅"}</div>
          <p>
            {isApiKeyMissing ? "Tambo not initialized" : "Tambo initialized"}
          </p>
        </div>
        {isApiKeyMissing && <ApiKeyMissingAlert />}
        {!isApiKeyMissing && children}
      </div>
    </div>
  );
}            # Tambo

> Tambo is a Generative UI Agent for React that lets AI dynamically render registered components. Tambo's UI Agent handles component registration, message threads, streaming, and tool integration.

Use `/llms-full.txt` for a single file containing all docs. Append `.mdx` to any docs path to fetch that page as Markdown (e.g. `/getting-started/quickstart.mdx`).

## tambo-docs

- [Generative UI toolkit for React](/): Register components the Tambo agent renders based on user messages.

## best-practices

- [Coding Agent MD Rules](/best-practices/coding-agent-generative-ui-rules): Concise rules for AI coding agents working with Tambo generative UI.
- [Component Props and Performance](/best-practices/component-data-props): Learn how to structure component props and Zod schemas so Tambo generates smaller payloads, faster responses, and more efficient generative UI in React.

## concepts

- [Additional Context](/concepts/additional-context): Help Tambo understand your users' environment and intent
- [Agent Configuration](/concepts/agent-configuration): Configure your Tambo agent's behavior, LLM provider, MCP servers, and authentication settings
- [Conversation Storage](/concepts/conversation-storage): How Tambo automatically persists conversations and makes them accessible across your application
- [Suggestions](/concepts/suggestions): This content has been moved to the conversation UI guide
- [Tools](/concepts/tools): How function calling transforms natural language interfaces from conversations into operating systems
- [User Authentication](/concepts/user-authentication): Learn how to authenticate users in Tambo and keep each user's threads and messages isolated.
- [Component State](/concepts/generative-interfaces/component-state): Pass component state to Tambo as context for following user messages.
- [Generative Components](/concepts/generative-interfaces/generative-components): Understanding how Tambo creates components on-demand in response to user messages.
- [Generative User Interfaces](/concepts/generative-interfaces): Understand how Tambo creates dynamic, visual interfaces in response to conversation instead of returning text-only responses.
- [Interactable Components](/concepts/generative-interfaces/interactable-components): Allow Tambo to update your pre-placed components
- [Client-side MCP connections](/concepts/model-context-protocol/clientside-mcp-connection): Client-side MCP connections run in the browser and use the user's existing session.
- [MCP Features](/concepts/model-context-protocol/features): Understanding tools, prompts, resources, elicitations, and sampling in MCP
- [Model Context Protocol (MCP)](/concepts/model-context-protocol): Connect Tambo to external tools and services using the MCP standard
- [Server-side MCP connections](/concepts/model-context-protocol/serverside-mcp-connection): Server-side MCP connections are configured in the Tambo dashboard and run on Tambo's backend.

## examples-and-templates

- [Chat Starter App](/examples-and-templates/chat-starter-app): A simple generative UI NextJS app ready for customization
- [Supabase MCP Client App](/examples-and-templates/supabase-mcp-client): Conversationally use Supabase

## getting-started

- [Components](/getting-started/components): Discover pre-built UI components for your Tambo application
- [Add Tambo to an existing app](/getting-started/integrate): Add Tambo generative UI to an existing React or Next.js application.
- [Quickstart](/getting-started/quickstart): Run the Tambo starter template and build your first generative UI feature.

## guides

- [Tambo Skills for Coding Agents](/guides/coding-agent-skills): Install Tambo skills to teach AI coding agents how to build generative UI apps
- [Connect MCP Servers](/guides/connect-mcp-servers): Connect external tools and data sources to Tambo using the Model Context Protocol (MCP).
- [Auth0](/guides/add-authentication/auth0): Learn how to integrate Tambo with Auth0 for user authentication.
- [Better Auth](/guides/add-authentication/better-auth): Learn how to integrate Tambo with Better Auth for user authentication.
- [Clerk](/guides/add-authentication/clerk): Learn how to integrate Tambo with Clerk for user authentication.
- [Add User Authentication](/guides/add-authentication): This guide helps you integrate user authentication with popular providers so users only access their own Tambo threads and messages.
- [Neon](/guides/add-authentication/neon): Learn how to integrate Tambo with Auth.js using Neon as the database backend for session storage.
- [Auth.js](/guides/add-authentication/nextauth): Learn how to integrate Tambo with Auth.js for user authentication.
- [Supabase](/guides/add-authentication/supabase): Learn how to integrate Tambo with Supabase Auth for user authentication.
- [WorkOS](/guides/add-authentication/workos): Learn how to integrate Tambo with WorkOS for user authentication.
- [Build a Custom Chat Interface](/guides/build-interfaces/build-chat-interface): This guide helps you create your own chat interface using the React SDK to access and display stored conversations.
- [Customize How MCP Features Display](/guides/build-interfaces/customize-mcp-display): This guide helps you build custom user interfaces for MCP prompts, resources, and elicitations that match your application design.
- [Give Tambo Components to Generate](/guides/enable-generative-ui/register-components): This guide helps you register React components so Tambo can intelligently create and render them in responses to user messages.
- [Let Users Edit Components Through Chat](/guides/enable-generative-ui/register-interactables): This guide helps you make pre-placed components editable by Tambo through natural language conversations.
- [Let Users Attach Context](/guides/give-context/let-users-attach-context): Stage temporary context that users explicitly add to messages
- [Make Tambo Aware of State](/guides/give-context/make-ai-aware-of-state): Automatically include information about the user's current state on every message
- [Make Context Referenceable](/guides/give-context/make-context-referenceable): Register resources that users can @ mention in messages
- [Give Tambo Access to Your Functions](/guides/take-actions/register-tools): This guide helps you register custom JavaScript functions as tools that Tambo can call to retrieve data or take actions.
- [Configure Agent Behavior](/guides/setup-project/agent-behavior): Write custom instructions to define your agent's personality and behavior
- [Create a Tambo Project](/guides/setup-project/create-project): Set up a new Tambo project in the dashboard and get your API key to start building AI-powered applications.
- [Configure LLM Provider](/guides/setup-project/llm-provider): Step-by-step guide to selecting and configuring LLM providers and models

## reference

- [REST API](/reference/rest-api): OpenAPI specification for the Tambo Cloud REST API
- [CSS & Tailwind Configuration](/reference/cli/configuration): See how the Tambo CLI configures CSS and Tailwind for installed components, and how to customize or recreate the setup in your own project.
- [Global Options](/reference/cli/global-options): Learn the global flags supported by the Tambo CLI and how to use them in CI, automation, and common workflows.
- [Tambo CLI overview](/reference/cli): Overview of Tambo CLI commands for scaffolding apps, installing components, updating projects, and managing generative UI for React.
- [Common Workflows](/reference/cli/workflows): Step-by-step Tambo CLI workflows for new projects, existing React apps, component management, and ongoing maintenance.
- [Anthropic](/reference/llm-providers/anthropic): Claude models from Anthropic for advanced reasoning, coding, and conversational AI tasks.
- [Cerebras](/reference/llm-providers/cerebras): Cerebras provider configuration for ultra-fast inference with Wafer-Scale Engine hardware.
- [Google Gemini Models](/reference/llm-providers/google): Google's Gemini models for multimodal understanding, reasoning, and agentic use cases.
- [Groq](/reference/llm-providers/groq): Groq provider configuration for Meta's Llama models with ultra-fast inference.
- [Models and Providers](/reference/llm-providers): Understanding AI model providers and how they integrate with Tambo
- [Labels](/reference/llm-providers/labels): What the Tested, Untested, and Known Issues labels mean and observed behaviors for certain models.
- [Mistral](/reference/llm-providers/mistral): Configure and use Mistral AI models in your Tambo project
- [OpenAI](/reference/llm-providers/openai): Configure OpenAI models in Tambo including GPT-5, GPT-4.1, o3, GPT-4o, and GPT-4 Turbo families with reasoning capabilities.
- [Reasoning Models](/reference/llm-providers/reasoning-models): Configure and use advanced reasoning capabilities in models that show their thinking process.
- [Endpoint Deprecated](/reference/problems/endpoint-deprecated): Error response when calling a deprecated API endpoint
- [React SDK Hooks](/reference/react-sdk/hooks): Complete reference for @tambo-ai/react hooks - thread management, component state, streaming, voice, and more.
- [React SDK Reference](/reference/react-sdk): Complete API reference for @tambo-ai/react - hooks, types, utilities, and providers for building AI-powered React applications.
- [MCP Reference](/reference/react-sdk/mcp): Model Context Protocol hooks, types, and utilities from @tambo-ai/react/mcp
- [Provider Components](/reference/react-sdk/providers): Reference for TamboProvider and other provider components used to configure Tambo in your React application.
- [TypeScript Types](/reference/react-sdk/types): TypeScript interfaces and types exported by @tambo-ai/react
- [Utility Functions](/reference/react-sdk/utilities): Helper functions for defining tools, making components interactable, and providing context to the AI.
- [React SDK 1.0 Hooks](/reference/react-sdk-v1/hooks): Complete reference for @tambo-ai/react/v1 hooks - thread management, messaging, suggestions, and component state.
- [React SDK 1.0 Reference (Coming Soon)](/reference/react-sdk-v1): API reference for @tambo-ai/react/v1 - the next generation of Tambo's React SDK with streaming-first architecture and explicit thread management.
- [Migrating to the React SDK 1.0](/reference/react-sdk-v1/migration): Step-by-step guide for migrating from @tambo-ai/react to the new @tambo-ai/react/v1 API.
- [React SDK 1.0 Providers](/reference/react-sdk-v1/providers): Reference for TamboV1Provider and other provider components used to configure Tambo V1 in your React application.
- [React SDK 1.0 Types](/reference/react-sdk-v1/types): TypeScript interfaces and types exported by @tambo-ai/react/v1
- [add](/reference/cli/commands/add): Add Tambo components to your project, install dependencies, and wire up CSS and Tailwind with the `tambo add` command.
- [create-app](/reference/cli/commands/create-app): Create a new Tambo generative UI starter app from templates using the `tambo create-app` command.
- [full-send](/reference/cli/commands/full-send): Run the `tambo full-send` command to initialize your project, generate config, and install recommended Tambo components in one step.
- [init](/reference/cli/commands/init): Use the `tambo init` command to create a Tambo project, get an API key, and configure authentication for your app.
- [list](/reference/cli/commands/list): List installed Tambo components and their locations in your project with the `tambo list` command.
- [migrate](/reference/cli/commands/migrate): Migrate legacy Tambo components into the dedicated `components/tambo` directory and update imports with the `tambo migrate` command.
- [update](/reference/cli/commands/update): Update specific or all installed Tambo components to their latest versions and apply required CSS or Tailwind changes.
- [upgrade](/reference/cli/commands/upgrade): Upgrade your entire Tambo project—including packages, components, and configuration—to known-safe versions with the `tambo upgrade` command.
- [Migrating from toolSchema to inputSchema/outputSchema](/reference/react-sdk/migration/toolschema): Guide for migrating tools from the deprecated toolSchema API to the new inputSchema/outputSchema pattern.

## tambo-mcp-server

- [Tambo MCP Server](/tambo-mcp-server): Learn how to set up the Tambo MCP server in various development environments.     "use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@/components/tambo/mcp-components";
import { McpConfigModal } from "./mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
  type StagedImage,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  AtSign,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import {
  getImageItems,
  TextEditor,
  type PromptItem,
  type ResourceItem,
  type TamboEditor,
} from "./text-editor";

// Lazy load DictationButton for code splitting (framework-agnostic alternative to next/dynamic)
// eslint-disable-next-line @typescript-eslint/promise-function-async
const LazyDictationButton = React.lazy(() => import("./dictation-button"));

/**
 * Wrapper component that includes Suspense boundary for the lazy-loaded DictationButton.
 * This ensures the component can be safely used without requiring consumers to add their own Suspense.
 * Also handles SSR by only rendering on the client (DictationButton uses Web Audio APIs).
 */
const DictationButton = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <LazyDictationButton />
    </React.Suspense>
  );
};

/**
 * Provider interface for searching resources (for "@" mentions).
 * Empty query string "" should return all available resources.
 */
export interface ResourceProvider {
  /** Search for resources matching the query */
  search(query: string): Promise<ResourceItem[]>;
}

/**
 * Provider interface for searching and fetching prompts (for "/" commands).
 * Empty query string "" should return all available prompts.
 */
export interface PromptProvider {
  /** Search for prompts matching the query */
  search(query: string): Promise<PromptItem[]>;
  /** Get the full prompt details including text by ID */
  get(id: string): Promise<PromptItem>;
}

/**
 * Removes duplicate resource items based on ID.
 */
const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Filters resource items by query string.
 * Empty query returns all items.
 */
const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Filters prompt items by query string.
 * Empty query returns all items.
 */
const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

const EXTERNAL_SEARCH_DEBOUNCE_MS = 200;

/**
 * Hook to get a combined resource list that merges MCP resources with an external provider.
 * Returns the combined, filtered resource items.
 *
 * @param externalProvider - Optional external resource provider
 * @param search - Search string to filter resources. For MCP servers, results are filtered locally.
 *                 For registry dynamic sources, the search is passed to listResources(search).
 */
function useCombinedResourceList(
  externalProvider: ResourceProvider | undefined,
  search: string,
): ResourceItem[] {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP resources to ResourceItems
  const mcpItems: ResourceItem[] = React.useMemo(
    () =>
      mcpResources
        ? (
            mcpResources as {
              resource: { uri: string; name?: string };
            }[]
          ).map((entry) => ({
            // Use the full URI (already includes serverKey prefix from MCP hook)
            // When inserted as @{id}, parseResourceReferences will strip serverKey before sending to backend
            id: entry.resource.uri,
            name: entry.resource.name ?? entry.resource.uri,
            icon: React.createElement(AtSign, { className: "w-4 h-4" }),
            componentData: { type: "mcp-resource", data: entry },
          }))
        : [],
    [mcpResources],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<ResourceItem[]>([]);

  // Fetch external resources when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external resources", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine and dedupe - MCP resources are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterResourceItems(externalItems, search);
    return dedupeResourceItems([...mcpItems, ...filteredExternal]);
  }, [mcpItems, externalItems, search]);

  return combined;
}

/**
 * Hook to get a combined prompt list that merges MCP prompts with an external provider.
 * Returns the combined, filtered prompt items.
 *
 * @param externalProvider - Optional external prompt provider
 * @param search - Search string to filter prompts by name. MCP prompts are filtered via the hook.
 */
function useCombinedPromptList(
  externalProvider: PromptProvider | undefined,
  search: string,
): PromptItem[] {
  // Pass search to MCP hook for filtering
  const { data: mcpPrompts } = useTamboMcpPromptList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP prompts to PromptItems (mark with mcp-prompt: prefix for special handling)
  const mcpItems: PromptItem[] = React.useMemo(
    () =>
      mcpPrompts
        ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
            id: `mcp-prompt:${entry.prompt.name}`,
            name: entry.prompt.name,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            text: "", // Text will be fetched when selected via useTamboMcpPrompt
          }))
        : [],
    [mcpPrompts],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<PromptItem[]>([]);

  // Fetch external prompts when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external prompts", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine - MCP prompts are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterPromptItems(externalItems, search);
    return [...mcpItems, ...filteredExternal];
  }, [mcpItems, externalItems, search]);

  return combined;
}

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-gray-300 [&>div]:dark:border-zinc-600",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {TamboEditor|null} editorRef - Reference to the TamboEditor instance
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {string | null} imageError - Error related to image uploads
 * @property {function} setImageError - Function to set the image upload error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    streamResponse?: boolean;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  editorRef: React.RefObject<TamboEditor>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  imageError: string | null;
  setImageError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the TamboEditor instance. */
  inputRef?: React.RefObject<TamboEditor>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        variant={variant}
        {...props}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";

const STORAGE_KEY = "tambo.components.messageInput.draft";

const getStorageKey = (key: string) => `${STORAGE_KEY}.${key}`;

const storeValueInSessionStorage = (key: string, value?: string) => {
  const storageKey = getStorageKey(key);
  if (value === undefined) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  sessionStorage.setItem(storageKey, JSON.stringify({ rawQuery: value }));
};

const getValueFromSessionStorage = (key: string): string => {
  const storedValue = sessionStorage.getItem(getStorageKey(key)) ?? "";
  try {
    const parsed = JSON.parse(storedValue);
    return parsed.rawQuery ?? "";
  } catch {
    return "";
  }
};

/**
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    removeImage,
  } = useTamboThreadInput();
  const { cancel, thread } = useTamboThread();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor>(null!);
  const dragCounter = React.useRef(0);

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    // On mount, load any stored draft value, but only if current value is empty
    const storedValue = getValueFromSessionStorage(thread.id);
    if (!storedValue) return;
    setValue((value) => value ?? storedValue);
  }, [setValue, thread.id]);

  React.useEffect(() => {
    setDisplayValue(value);
    storeValueInSessionStorage(thread.id, value);
    if (value && editorRef.current) {
      editorRef.current.focus();
    }
  }, [value, thread.id]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      // Clear any previous errors
      setSubmitError(null);
      setImageError(null);
      setDisplayValue("");
      storeValueInSessionStorage(thread.id);
      setIsSubmitting(true);

      // Extract resource names directly from editor at submit time to ensure we have the latest
      let latestResourceNames: Record<string, string> = {};
      const editor = editorRef.current;
      if (editor) {
        const extracted = editor.getTextWithResourceURIs();
        latestResourceNames = extracted.resourceNames;
      }

      const imageIdsAtSubmitTime = images.map((image) => image.id);

      try {
        await submit({
          streamResponse: true,
          resourceNames: latestResourceNames,
        });
        setValue("");
        // Clear only the images that were staged when submission started so
        // any images added while the request was in-flight are preserved.
        if (imageIdsAtSubmitTime.length > 0) {
          imageIdsAtSubmitTime.forEach((id) => removeImage(id));
        }
        // Refocus the editor after a successful submission
        setTimeout(() => {
          editorRef.current?.focus();
        }, 0);
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);
        // On submit failure, also clear image error
        setImageError(null);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        );

        // Cancel the thread to reset loading state
        await cancel();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancel,
      isSubmitting,
      images,
      removeImage,
      editorRef,
      thread.id,
    ],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        const totalImages = images.length + files.length;
        if (totalImages > MAX_IMAGES) {
          setImageError(`Max ${MAX_IMAGES} uploads at a time`);
          return;
        }
        setImageError(null); // Clear previous error
        try {
          await addImages(files);
        } catch (error) {
          console.error("Failed to add dropped images:", error);
          setImageError(
            error instanceof Error
              ? error.message
              : "Failed to add images. Please try again.",
          );
        }
      }
    },
    [addImages, images, setImageError],
  );

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      // Calling resolveElicitation automatically clears the elicitation state
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
  );

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(newValue);
        setDisplayValue(newValue);
      },
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
      error,
      editorRef: inputRef ?? editorRef,
      submitError,
      setSubmitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      inputRef,
      editorRef,
      submitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Symbol for marking pasted images
 */
const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

/** Maximum number of images that can be staged at once */
const MAX_IMAGES = 10;

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom placeholder text. */
  placeholder?: string;
  /** Resource provider for @ mentions (optional - includes interactables by default) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional) */
  promptProvider?: PromptProvider;
  /** Callback when a resource is selected from @ mentions (optional) */
  onResourceSelect?: (item: ResourceItem) => void;
}

/**
 * Rich-text textarea component for entering message text with @ mention support.
 * Uses the TipTap-based TextEditor which supports:
 * - @ mention autocomplete for interactables plus optional static items and async fetchers
 * - Keyboard navigation (Enter to submit, Shift+Enter for newline)
 * - Image paste handling via the thread input context
 *
 * **Note:** This component uses refs internally to ensure callbacks stay fresh,
 * so consumers can pass updated providers on each render without worrying about
 * closure issues with the TipTap editor.
 *
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea
 *     placeholder="Type your message..."
 *     resourceProvider={{
 *       search: async (query) => {
 *         // Return custom resources
 *         return [{ id: "foo", name: "Foo" }];
 *       }
 *     }}
 *   />
 * </MessageInput>
 * ```
 */
const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  resourceProvider,
  promptProvider,
  onResourceSelect,
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, handleSubmit, editorRef, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  // Resource names are extracted from editor at submit time, no need to track in state
  const setResourceNames = React.useCallback(
    (
      _resourceNames:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      // No-op - we extract resource names directly from editor at submit time
    },
    [],
  );

  // Track search state for resources (controlled by TextEditor)
  const [resourceSearch, setResourceSearch] = React.useState("");

  // Track search state for prompts (controlled by TextEditor)
  const [promptSearch, setPromptSearch] = React.useState("");

  // Get combined resource list (MCP + external provider), filtered by search
  const resourceItems = useCombinedResourceList(
    resourceProvider,
    resourceSearch,
  );

  // Get combined prompt list (MCP + external provider), filtered by search
  const promptItems = useCombinedPromptList(promptProvider, promptSearch);

  // State for MCP prompt fetching (since we can't call hooks inside get())
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  // Handle MCP prompt insertion when data is fetched
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = selectedMcpPromptData?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg) => {
            if (msg.content?.type === "text") {
              return msg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.setContent(promptText);
          setValue(promptText);
          editor.focus("end");
        }
      }
      setSelectedMcpPromptName(null);
    }
  }, [selectedMcpPromptData, selectedMcpPromptName, editorRef, setValue]);

  // Handle prompt selection - check if it's an MCP prompt
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  // Handle image paste - mark as pasted and add to thread
  const pendingImagesRef = React.useRef(0);

  const handleAddImage = React.useCallback(
    async (file: File) => {
      if (images.length + pendingImagesRef.current >= MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        return;
      }
      setImageError(null);
      pendingImagesRef.current += 1;
      try {
        file[IS_PASTED_IMAGE] = true;
        await addImage(file);
      } finally {
        pendingImagesRef.current -= 1;
      }
    },
    [addImage, images, setImageError],
  );

  return (
    <div
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      {...props}
    >
      <TextEditor
        ref={editorRef}
        value={value}
        onChange={setValue}
        onResourceNamesChange={setResourceNames}
        onSubmit={handleSubmit}
        onAddImage={handleAddImage}
        placeholder={placeholder}
        disabled={!isIdle || isUpdatingToken}
        className="bg-background text-foreground"
        onSearchResources={setResourceSearch}
        resources={resourceItems}
        onSearchPrompts={setPromptSearch}
        prompts={promptItems}
        onResourceSelect={onResourceSelect ?? (() => {})}
        onPromptSelect={handlePromptSelect}
      />
    </div>
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the legacy plain textarea message input component.
 * This preserves the original MessageInput.Textarea API for backward compatibility.
 */
export interface MessageInputPlainTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Legacy textarea-based message input component.
 *
 * This mirrors the previous MessageInput.Textarea implementation using a native
 * `<textarea>` element. It remains available as an opt-in escape hatch for
 * consumers that relied on textarea-specific props or refs.
 */
const MessageInputPlainTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputPlainTextareaProps) => {
  const { value, setValue, handleSubmit, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { imageItems, hasText } = getImageItems(e.clipboardData);

    if (imageItems.length === 0) {
      return; // Allow default text paste
    }

    if (!hasText) {
      e.preventDefault(); // Only prevent when image-only paste
    }

    const totalImages = images.length + imageItems.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Max ${MAX_IMAGES} uploads at a time`);
      return;
    }
    setImageError(null);

    for (const item of imageItems) {
      try {
        // Mark this image as pasted so we can show "Image 1", "Image 2", etc.
        item[IS_PASTED_IMAGE] = true;
        await addImage(item);
      } catch (error) {
        console.error("Failed to add pasted image:", error);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputPlainTextarea.displayName = "MessageInput.PlainTextarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
  const { cancel, isIdle } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Show cancel button if either:
  // 1. A mutation is in progress (isPending), OR
  // 2. Thread is stuck in a processing state (e.g., after browser refresh during tool execution)
  const showCancelButton = isPending || !isIdle;

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={showCancelButton ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={showCancelButton ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={showCancelButton ? "Cancel message" : "Send message"}
      data-slot={
        showCancelButton ? "message-input-cancel" : "message-input-submit"
      }
      {...props}
    >
      {children ??
        (showCancelButton ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      color="#000000"
      fill="none"
    >
      <path
        d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};
/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInput.McpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <>
      <Tooltip content="Configure MCP Servers" side="right">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  if (!error && !submitError && !imageError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError ?? imageError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 * @component MessageInput.FileButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
  const { addImages, images } = useTamboThreadInput();
  const { setImageError } = useMessageInputContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    try {
      const totalImages = images.length + files.length;

      if (totalImages > MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        e.target.value = "";
        return;
      }

      setImageError(null);
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label="Attach Images"
        data-slot="message-input-file-button"
        {...props}
      >
        <Paperclip className="w-4 h-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * Wraps McpPromptButton and connects it to MessageInput context.
 * @component MessageInput.McpPromptButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  return (
    <McpPromptButton
      ref={ref}
      {...props}
      value={value}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";

/**
 * Props for the MessageInputMcpResourceButton component.
 */
export type MessageInputMcpResourceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Resource picker button component for inserting resource references from MCP servers.
 * Wraps McpResourceButton and connects it to MessageInput context.
 * @component MessageInput.McpResourceButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.McpResourceButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpResourceButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpResourceButtonProps
>(({ ...props }, ref) => {
  const { setValue, value, editorRef } = useMessageInputContext();

  const insertResourceReference = React.useCallback(
    (id: string, label: string) => {
      const editor = editorRef.current;
      if (editor) {
        editor.insertMention(id, label);
        setValue(editor.getTextWithResourceURIs().text);
        return;
      }
      // Fallback: append to end of plain text value
      const newValue = value ? `${value} ${id}` : id;
      setValue(newValue);
    },
    [editorRef, setValue, value],
  );

  return (
    <McpResourceButton
      ref={ref}
      {...props}
      value={value}
      onInsertResource={insertResourceReference}
    />
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";

/**
 * Props for the ImageContextBadge component.
 */
interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * ContextBadge component that displays a staged image with expandable preview.
 * Shows a compact badge with icon and name by default, expands to show image preview on click.
 *
 * @component
 * @example
 * ```tsx
 * <ImageContextBadge
 *   image={stagedImage}
 *   displayName="Image"
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   onRemove={() => removeImage(image.id)}
 * />
 * ```
 */
const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.dataUrl}
              alt={displayName}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

/**
 * Props for the MessageInputStagedImages component.
 */
export type MessageInputStagedImagesProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays currently staged images with preview and remove functionality.
 * @component MessageInput.StagedImages
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.StagedImages />
 *   <MessageInput.Textarea />
 * </MessageInput>
 * ```
 */
const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file?.[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Convenience wrapper that renders staged images as context badges.
 * Keeps API parity with the web app's MessageInputContexts component.
 */
const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <MessageInputStagedImages
    ref={ref}
    className={cn("pb-2 pt-1 border-b border-border", className)}
    {...props}
  />
));
MessageInputContexts.displayName = "MessageInputContexts";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className,
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Left side - everything except submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; // Don't render submit button here
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        <DictationButton />
        {/* Right side - only submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; // Only render submit button here
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  DictationButton,
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputPlainTextarea,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};

// Re-export types from text-editor for convenience
export type { PromptItem, ResourceItem } from "./text-editor";     import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";

const KeyFilesSection = () => (
  <div className="bg-white px-8 py-4">
    <h2 className="text-xl font-semibold mb-4">How it works:</h2>
    <ul className="space-y-4 text-gray-600">
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium">src/app/layout.tsx</code> - Main layout
          with TamboProvider
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">src/app/chat/page.tsx</code> -
          Chat page with TamboProvider and MCP integration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            src/app/interactables/page.tsx
          </code>{" "}
          - Interactive demo page with tools and components
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            src/components/tambo/message-thread-full.tsx
          </code>{" "}
          - Chat UI
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            src/components/tambo/graph.tsx
          </code>{" "}
          - A generative graph component
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            src/services/population-stats.ts
          </code>{" "}
          - Example tool implementation with mock population data
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono">src/lib/tambo.ts</code> -
          Component and tool registration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono">README.md</code> - For more
          details check out the README
        </span>
      </li>
    </ul>
    <div className="flex gap-4 flex-wrap mt-4">
      <a
        href="https://docs.tambo.co"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        View Docs
      </a>
      <a
        href="https://tambo.co/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        Dashboard
      </a>
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank" rel="noopener noreferrer">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo AI Logo"
              width={80}
              height={80}
              className="mb-4"
            />
          </a>
          <h1 className="text-4xl text-center">tambo-ai chat template</h1>
        </div>

        <div className="w-full space-y-8">
          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>
            <ApiKeyCheck>
              <div className="flex gap-4 flex-wrap">
                <a
                  href="/chat"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800"
                >
                  Go to Chat →
                </a>
                <a
                  href="/interactables"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#FFE17F] hover:bg-[#f5d570] text-gray-800"
                >
                  Interactables Demo →
                </a>
              </div>
            </ApiKeyCheck>
          </div>

          <KeyFilesSection />
        </div>
      </main>
    </div>
  );
}    "use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "es", "fr", "de"]),
  privacy: z.object({
    shareAnalytics: z.boolean(),
    personalizationEnabled: z.boolean(),
  }),
});

type SettingsProps = z.infer<typeof settingsSchema>;

function SettingsPanelBase(props: SettingsProps) {
  const [settings, setSettings] = useState<SettingsProps>(props);
  const [emailError, setEmailError] = useState<string>("");
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
  const prevPropsRef = useRef<SettingsProps>(props);

  // Update local state when props change from Tambo
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    console.log("Props effect triggered");
    console.log("Previous props:", prevProps);
    console.log("Current props:", props);

    // Find which fields changed
    const changedFields = new Set<string>();

    // Check each field for changes
    if (props.name !== prevProps.name) {
      changedFields.add("name");
      console.log("Name changed:", prevProps.name, "->", props.name);
    }
    if (props.email !== prevProps.email) {
      changedFields.add("email");
      console.log("Email changed:", prevProps.email, "->", props.email);
    }
    if (props.theme !== prevProps.theme) {
      changedFields.add("theme");
      console.log("Theme changed:", prevProps.theme, "->", props.theme);
    }
    if (props.language !== prevProps.language) {
      changedFields.add("language");
      console.log(
        "Language changed:",
        prevProps.language,
        "->",
        props.language,
      );
    }

    // Check notification fields
    if (props.notifications.email !== prevProps.notifications.email) {
      changedFields.add("notifications.email");
    }
    if (props.notifications.push !== prevProps.notifications.push) {
      changedFields.add("notifications.push");
    }
    if (props.notifications.sms !== prevProps.notifications.sms) {
      changedFields.add("notifications.sms");
    }

    // Check privacy fields
    if (props.privacy.shareAnalytics !== prevProps.privacy.shareAnalytics) {
      changedFields.add("privacy.shareAnalytics");
    }
    if (
      props.privacy.personalizationEnabled !==
      prevProps.privacy.personalizationEnabled
    ) {
      changedFields.add("privacy.personalizationEnabled");
    }

    console.log("Changed fields:", Array.from(changedFields));

    // Update state and ref
    setSettings(props);
    prevPropsRef.current = props;

    if (changedFields.size > 0) {
      setUpdatedFields(changedFields);
      // Clear highlights after animation
      const timer = setTimeout(() => {
        setUpdatedFields(new Set());
        console.log("Cleared animation fields");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [props]);

  const handleChange = (updates: Partial<SettingsProps>) => {
    setSettings((prev) => ({ ...prev, ...updates }));

    // Validate email if it's being updated
    if ("email" in updates) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email as string)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h2>

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange({ name: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("name") ? "animate-pulse" : ""
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange({ email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                } ${updatedFields.has("email") ? "animate-pulse" : ""}`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Notifications
          </h3>
          <div className="space-y-3">
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.email") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Email notifications
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.push") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      push: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Push notifications
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("notifications.sms") ? "animate-pulse" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  handleChange({
                    notifications: {
                      ...settings.notifications,
                      sms: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                SMS notifications
              </span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) =>
                  handleChange({
                    theme: e.target.value as "light" | "dark" | "system",
                  })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("theme") ? "animate-pulse" : ""
                }`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  handleChange({
                    language: e.target.value as "en" | "es" | "fr" | "de",
                  })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  updatedFields.has("language") ? "animate-pulse" : ""
                }`}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
          <div className="space-y-3">
            <label
              className={`flex items-center ${
                updatedFields.has("privacy.shareAnalytics")
                  ? "animate-pulse"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.privacy.shareAnalytics}
                onChange={(e) =>
                  handleChange({
                    privacy: {
                      ...settings.privacy,
                      shareAnalytics: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Share usage analytics
              </span>
            </label>
            <label
              className={`flex items-center ${
                updatedFields.has("privacy.personalizationEnabled")
                  ? "animate-pulse"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={settings.privacy.personalizationEnabled}
                onChange={(e) =>
                  handleChange({
                    privacy: {
                      ...settings.privacy,
                      personalizationEnabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable personalization
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Current Settings (JSON)
        </h4>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Create the interactable component
const InteractableSettingsPanel = withInteractable(SettingsPanelBase, {
  componentName: "SettingsForm",
  description:
    "User settings form with personal info, notifications, and preferences",
  propsSchema: settingsSchema,
});

// Export a wrapper that provides default props and handles state
export function SettingsPanel() {
  return (
    <InteractableSettingsPanel
      name="Alice Johnson"
      email="alice@example.com"
      notifications={{
        email: true,
        push: false,
        sms: true,
      }}
      theme="light"
      language="en"
      privacy={{
        shareAnalytics: false,
        personalizationEnabled: true,
      }}
      onPropsUpdate={(newProps) => {
        console.log("Settings updated from Tambo:", newProps);
      }}
    />
  );
}    "use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

/**
 * Home page component that renders the Tambo chat interface.
 *
 * @remarks
 * The `NEXT_PUBLIC_TAMBO_URL` environment variable specifies the URL of the Tambo server.
 * You do not need to set it if you are using the default Tambo server.
 * It is only required if you are running the API server locally.
 *
 * @see {@link https://github.com/tambo-ai/tambo/blob/main/CONTRIBUTING.md} for instructions on running the API server locally.
 */
export default function Home() {
  // Load MCP server configurations
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-screen">
        <MessageThreadFull className="max-w-4xl mx-auto"/>
      </div>
    </TamboProvider>
  );
}    "use client";

import type { messageVariants } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { MessageInputMcpConfigButton } from "@/components/tambo/message-input";
import { ThreadContainer, useThreadContainerContext } from "./thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/tambo/thread-history";
import { useMergeRefs } from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, variant, ...props }, ref) => {
  const { containerRef, historyPosition } = useThreadContainerContext();
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, containerRef);

  const threadHistorySidebar = (
    <ThreadHistory position={historyPosition}>
      <ThreadHistoryHeader />
      <ThreadHistoryNewButton />
      <ThreadHistorySearch />
      <ThreadHistoryList />
    </ThreadHistory>
  );

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Learn more",
      detailedSuggestion: "Tell me about your capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Show me some example queries I can try.",
      messageId: "examples-query",
    },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Thread History Sidebar - rendered first if history is on the left */}
      {historyPosition === "left" && threadHistorySidebar}

      <ThreadContainer
        ref={mergedRef}
        disableSidebarSpacing
        className={className}
        {...props}
      >
        <ScrollableMessageContainer className="p-4">
          <ThreadContent variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>

        {/* Message suggestions status */}
        <MessageSuggestions>
          <MessageSuggestionsStatus />
        </MessageSuggestions>

        {/* Message input */}
        <div className="px-4 pb-4">
          <MessageInput>
            <MessageInputTextarea placeholder="Type your message or paste images..." />
            <MessageInputToolbar>
              <MessageInputFileButton />
              <MessageInputMcpPromptButton />
              <MessageInputMcpResourceButton />
              {/* Uncomment this to enable client-side MCP config modal button */}
              <MessageInputMcpConfigButton />
              <MessageInputSubmitButton />
            </MessageInputToolbar>
            <MessageInputError />
          </MessageInput>
        </div>

        {/* Message suggestions */}
        <MessageSuggestions initialSuggestions={defaultSuggestions}>
          <MessageSuggestionsList />
        </MessageSuggestions>
      </ThreadContainer>

      {/* Thread History Sidebar - rendered last if history is on the right */}
      {historyPosition === "right" && threadHistorySidebar}
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";    "use client";

import { cn } from "@/lib/utils";
import * as Popover from "@radix-ui/react-popover";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import {
  EditorContent,
  Extension,
  useEditor,
  type Editor,
} from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";
import { Cuboid, FileText } from "lucide-react";
import * as React from "react";
import { useImperativeHandle, useState } from "react";

/**
 * Result of extracting images from clipboard data.
 */
export interface ImageItems {
  imageItems: File[];
  hasText: boolean;
}

/**
 * Returns images array and hasText bool from clipboard data.
 * @param clipboardData - The clipboard data from a paste event
 * @returns Object containing extracted images array and whether text was present
 */
export function getImageItems(
  clipboardData: DataTransfer | null | undefined,
): ImageItems {
  const items = Array.from(clipboardData?.items ?? []);
  const imageItems: File[] = [];

  for (const item of items) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const image = item.getAsFile();
    if (image) {
      imageItems.push(image);
    }
  }

  const text = clipboardData?.getData("text/plain") ?? "";

  return {
    imageItems,
    hasText: text.length > 0 ? true : false,
  };
}

/**
 * Minimal editor interface exposed to parent components.
 * Hides TipTap implementation details and exposes only necessary operations.
 */
export interface TamboEditor {
  /** Focus the editor at a specific position */
  focus(position?: "start" | "end"): void;
  /** Set the editor content */
  setContent(content: string): void;
  /** Append text to the end of the editor content */
  appendText(text: string): void;
  /** Get the text and resource names */
  getTextWithResourceURIs(): {
    text: string;
    resourceNames: Record<string, string>;
  };
  /** Check if a mention with the given id exists */
  hasMention(id: string): boolean;
  /** Insert a mention node with a following space */
  insertMention(id: string, label: string): void;
  /** Set whether the editor is editable */
  setEditable(editable: boolean): void;
}

/**
 * Base interface for suggestion items (resources and prompts).
 */
interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

/**
 * Represents a resource item that appears in the "@" mention dropdown.
 * Resources are referenced by ID/URI and appear as visual mention nodes in the editor.
 */
export interface ResourceItem extends SuggestionItem {
  componentData?: unknown;
}

/**
 * Represents a prompt item that appears in the "/" command dropdown.
 * Prompts contain text that gets inserted into the editor.
 */
export interface PromptItem extends SuggestionItem {
  /** The actual prompt text to insert into the editor */
  text: string;
}

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onResourceNamesChange: (
    resourceNames:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Submit handler for Enter key behavior */
  onSubmit: (e: React.FormEvent) => Promise<void>;
  /** Called when an image is pasted into the editor */
  onAddImage: (file: File) => Promise<void>;
  /** Called when resource search query changes (for "@" mentions) - parent should update `resources` prop */
  onSearchResources: (query: string) => void;
  /** Current list of resources to show in the "@" suggestion menu (controlled) */
  resources: ResourceItem[];
  /** Called when prompt search query changes (for "/" commands) - parent should update `prompts` prop */
  onSearchPrompts: (query: string) => void;
  /** Current list of prompts to show in the "/" suggestion menu (controlled) */
  prompts: PromptItem[];
  /** Called when a resource is selected from the "@" menu */
  onResourceSelect: (item: ResourceItem) => void;
  /** Called when a prompt is selected from the "/" menu */
  onPromptSelect: (item: PromptItem) => void;
}

/**
 * State for a suggestion popover.
 */
interface SuggestionState<T extends SuggestionItem> {
  isOpen: boolean;
  items: T[];
  selectedIndex: number;
  position: { top: number; left: number; lineHeight: number } | null;
  command: ((item: T) => void) | null;
}

/**
 * Ref value for accessing suggestion state from TipTap callbacks.
 */
interface SuggestionRef<T extends SuggestionItem> {
  state: SuggestionState<T>;
  setState: (update: Partial<SuggestionState<T>>) => void;
}

/**
 * Utility function to convert TipTap clientRect to position coordinates.
 * Includes line height for proper spacing when popup flips above cursor.
 */
function getPositionFromClientRect(
  clientRect?: (() => DOMRect | null) | null,
): { top: number; left: number; lineHeight: number } | null {
  if (!clientRect) return null;
  const rect = clientRect();
  if (!rect) return null;
  const lineHeight = rect.height || 20; // Fallback to 20px if height not available
  return { top: rect.bottom, left: rect.left, lineHeight };
}

/**
 * Props for the generic suggestion popover.
 */
interface SuggestionPopoverProps<T extends SuggestionItem> {
  state: SuggestionState<T>;
  onClose: () => void;
  defaultIcon: React.ReactNode;
  emptyMessage: string;
  /** Whether to use monospace font for the secondary text (id) */
  monoSecondary?: boolean;
}

/**
 * Generic popover component for suggestions (@resources and /prompts).
 */
function SuggestionPopover<T extends SuggestionItem>({
  state,
  onClose,
  defaultIcon,
  emptyMessage,
  monoSecondary = false,
}: SuggestionPopoverProps<T>) {
  if (!state.isOpen || !state.position) return null;

  const sideOffset = state.position.lineHeight + 4;

  return (
    <Popover.Root
      open={state.isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Popover.Anchor asChild>
        <div
          style={{
            position: "fixed",
            top: `${state.position.top}px`,
            left: `${state.position.left}px`,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Popover.Anchor>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        className="z-50 w-96 rounded-md border bg-popover p-0 shadow-md animate-in fade-in-0 zoom-in-95"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        {state.items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 p-1">
            {state.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === state.selectedIndex &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => state.command?.(item)}
              >
                {item.icon ?? defaultIcon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground truncate",
                      monoSecondary && "font-mono",
                    )}
                  >
                    {item.id}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}

/**
 * Internal helper to check if a mention exists in a raw TipTap Editor.
 */
function checkMentionExists(editor: Editor, label: string): boolean {
  if (!editor.state?.doc) return false;
  let exists = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        exists = true;
        return false;
      }
    }
    return true;
  });
  return exists;
}

/**
 * Creates the resource mention configuration for TipTap Mention extension.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
function createResourceMentionConfig(
  onSearchChange: (query: string) => void,
  onSelect: (item: ResourceItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<ResourceItem>>,
): Omit<SuggestionOptions, "editor"> {
  return {
    char: "@",
    items: ({ query }) => {
      onSearchChange(query);
      return [];
    },

    render: () => {
      const createWrapCommand =
        (
          editor: Editor,
          tiptapCommand: (attrs: { id: string; label: string }) => void,
        ) =>
        (item: ResourceItem) => {
          if (checkMentionExists(editor, item.name)) return;
          tiptapCommand({ id: item.id, label: item.name });
          onSelect(item);
        };

      return {
        onStart: (props) => {
          stateRef.current.setState({
            isOpen: true,
            selectedIndex: 0,
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
          });
        },
        onUpdate: (props) => {
          stateRef.current.setState({
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
            selectedIndex: 0,
          });
        },
        onKeyDown: ({ event }) => {
          const { state, setState } = stateRef.current;
          if (!state.isOpen) return false;

          const handlers: Record<string, () => boolean> = {
            ArrowUp: () => {
              if (state.items.length === 0) return false;
              setState({
                selectedIndex:
                  (state.selectedIndex - 1 + state.items.length) %
                  state.items.length,
              });
              return true;
            },
            ArrowDown: () => {
              if (state.items.length === 0) return false;
              setState({
                selectedIndex: (state.selectedIndex + 1) % state.items.length,
              });
              return true;
            },
            Enter: () => {
              const item = state.items[state.selectedIndex];
              if (item && state.command) {
                state.command(item);
                return true;
              }
              return false;
            },
            Escape: () => {
              setState({ isOpen: false });
              return true;
            },
          };

          const handler = handlers[event.key];
          if (handler) {
            event.preventDefault();
            return handler();
          }
          return false;
        },
        onExit: () => {
          stateRef.current.setState({ isOpen: false });
        },
      };
    },
  };
}

/**
 * Creates a custom TipTap extension for prompt commands using the Suggestion plugin.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
function createPromptCommandExtension(
  onSearchChange: (query: string) => void,
  onSelect: (item: PromptItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<PromptItem>>,
) {
  return Extension.create({
    name: "promptCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          items: ({ query, editor }) => {
            // Only show prompts when editor is empty (except for the "/" and query)
            const editorValue = editor.getText().replace("/", "").trim();
            if (editorValue.length > 0) {
              stateRef.current.setState({ isOpen: false });
              return [];
            }
            // Trigger search - actual items come from props via stateRef
            onSearchChange(query);
            return [];
          },
          render: () => {
            // Store command creator that captures editor context
            let createCommand: ((item: PromptItem) => void) | null = null;

            return {
              onStart: (props) => {
                createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  isOpen: true,
                  selectedIndex: 0,
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                });
              },
              onUpdate: (props) => {
                createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                  selectedIndex: 0,
                });
              },
              onKeyDown: ({ event }) => {
                const { state, setState } = stateRef.current;
                if (!state.isOpen) return false;

                const handlers: Record<string, () => boolean> = {
                  ArrowUp: () => {
                    if (state.items.length === 0) return false;
                    setState({
                      selectedIndex:
                        (state.selectedIndex - 1 + state.items.length) %
                        state.items.length,
                    });
                    return true;
                  },
                  ArrowDown: () => {
                    if (state.items.length === 0) return false;
                    setState({
                      selectedIndex:
                        (state.selectedIndex + 1) % state.items.length,
                    });
                    return true;
                  },
                  Enter: () => {
                    const item = state.items[state.selectedIndex];
                    if (item && state.command) {
                      state.command(item);
                      return true;
                    }
                    return false;
                  },
                  Escape: () => {
                    setState({ isOpen: false });
                    return true;
                  },
                };

                const handler = handlers[event.key];
                if (handler) {
                  event.preventDefault();
                  return handler();
                }
                return false;
              },
              onExit: () => {
                stateRef.current.setState({ isOpen: false });
              },
            };
          },
        }),
      ];
    },
  });
}

/**
 * Custom text extraction that serializes mention nodes with their ID (resource URI).
 */
function getTextWithResourceURIs(editor: Editor | null): {
  text: string;
  resourceNames: Record<string, string>;
} {
  if (!editor?.state?.doc) return { text: "", resourceNames: {} };

  let text = "";
  const resourceNames: Record<string, string> = {};

  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const id = node.attrs.id ?? "";
      const label = node.attrs.label ?? "";
      text += `@${id}`;
      if (label && id) {
        resourceNames[id] = label;
      }
    } else if (node.type.name === "hardBreak") {
      text += "\n";
    } else if (node.isText) {
      text += node.text;
    }
    return true;
  });

  return { text, resourceNames };
}

/**
 * Hook to create suggestion state with a ref for TipTap access.
 */
function useSuggestionState<T extends SuggestionItem>(
  externalItems?: T[],
): [SuggestionState<T>, React.MutableRefObject<SuggestionRef<T>>] {
  const [state, setStateInternal] = useState<SuggestionState<T>>({
    isOpen: false,
    items: externalItems ?? [],
    selectedIndex: 0,
    position: null,
    command: null,
  });

  const setState = React.useCallback((update: Partial<SuggestionState<T>>) => {
    setStateInternal((prev) => ({ ...prev, ...update }));
  }, []);

  const stateRef = React.useRef<SuggestionRef<T>>({ state, setState });

  // Keep ref in sync
  React.useEffect(() => {
    stateRef.current = { state, setState };
  }, [state, setState]);

  // Sync external items when provided
  React.useEffect(() => {
    if (externalItems !== undefined) {
      setStateInternal((prev) => {
        if (prev.items === externalItems) {
          return prev;
        }

        const previousMaxIndex = Math.max(prev.items.length - 1, 0);
        const safePrevIndex = Math.min(
          Math.max(prev.selectedIndex, 0),
          previousMaxIndex,
        );

        const selectedItem = prev.items[safePrevIndex];
        const matchedIndex = selectedItem
          ? externalItems.findIndex((item) => item.id === selectedItem.id)
          : -1;

        const maxIndex = Math.max(externalItems.length - 1, 0);
        const nextSelectedIndex =
          matchedIndex >= 0 ? matchedIndex : Math.min(safePrevIndex, maxIndex);

        return {
          ...prev,
          items: externalItems,
          selectedIndex: nextSelectedIndex,
        };
      });
    }
  }, [externalItems]);

  return [state, stateRef];
}

/**
 * Text editor component with resource ("@") and prompt ("/") support.
 */
export const TextEditor = React.forwardRef<TamboEditor, TextEditorProps>(
  (
    {
      value,
      onChange,
      onResourceNamesChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      onSubmit,
      onAddImage,
      onSearchResources,
      resources,
      onSearchPrompts,
      prompts,
      onResourceSelect,
      onPromptSelect,
    },
    ref,
  ) => {
    // Suggestion states with refs for TipTap access
    const [resourceState, resourceRef] =
      useSuggestionState<ResourceItem>(resources);
    const [promptState, promptRef] = useSuggestionState<PromptItem>(prompts);

    // Consolidated ref for callbacks that TipTap needs to access
    const callbacksRef = React.useRef({
      onSearchResources,
      onResourceSelect,
      onSearchPrompts,
      onPromptSelect,
    });

    React.useEffect(() => {
      callbacksRef.current = {
        onSearchResources,
        onResourceSelect,
        onSearchPrompts,
        onPromptSelect,
      };
    }, [onSearchResources, onResourceSelect, onSearchPrompts, onPromptSelect]);

    // Stable callbacks for TipTap
    const stableSearchResources = React.useCallback(
      (query: string) => callbacksRef.current.onSearchResources(query),
      [],
    );

    const stableSearchPrompts = React.useCallback(
      (query: string) => callbacksRef.current.onSearchPrompts(query),
      [],
    );

    const handleResourceSelect = React.useCallback(
      (item: ResourceItem) => callbacksRef.current.onResourceSelect(item),
      [],
    );

    const handlePromptSelect = React.useCallback(
      (item: PromptItem) => callbacksRef.current.onPromptSelect(item),
      [],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim()) {
          e.preventDefault();
          void onSubmit(e as React.FormEvent);
          return;
        }
        onKeyDown?.(e);
      },
      [onSubmit, value, onKeyDown],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak,
        Placeholder.configure({ placeholder }),
        Mention.configure({
          HTMLAttributes: {
            class:
              "mention resource inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          },
          suggestion: createResourceMentionConfig(
            stableSearchResources,
            handleResourceSelect,
            resourceRef,
          ),
          renderLabel: ({ node }) => `@${(node.attrs.label as string) ?? ""}`,
        }),
        createPromptCommandExtension(
          stableSearchPrompts,
          handlePromptSelect,
          promptRef,
        ),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const { text, resourceNames } = getTextWithResourceURIs(editor);
        if (text !== value) {
          onChange(text);
        }
        if (onResourceNamesChange) {
          onResourceNamesChange((prev) => ({ ...prev, ...resourceNames }));
        }
      },
      editorProps: {
        attributes: {
          class: cn(
            "tiptap",
            "prose prose-sm max-w-none focus:outline-none",
            "p-3 rounded-t-lg bg-transparent text-sm leading-relaxed",
            "min-h-[82px] max-h-[40vh] overflow-y-auto",
            "break-words whitespace-pre-wrap",
            className,
          ),
        },
        handlePaste: (_view, event) => {
          const { imageItems, hasText } = getImageItems(event.clipboardData);

          if (imageItems.length === 0) return false;

          if (!hasText) {
            event.preventDefault();
          }

          void (async () => {
            for (const item of imageItems) {
              try {
                await onAddImage(item);
              } catch (error) {
                console.error("Failed to add pasted image:", error);
              }
            }
          })();

          return !hasText;
        },
        handleKeyDown: (_view, event) => {
          const anyMenuOpen = resourceState.isOpen || promptState.isOpen;

          if (anyMenuOpen) return false;

          if (event.key === "Enter" && !event.shiftKey && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            handleKeyDown(reactEvent);
            return reactEvent.defaultPrevented;
          }

          return false;
        },
      },
    });

    useImperativeHandle(ref, () => {
      if (!editor) {
        return {
          focus: () => {},
          setContent: () => {},
          appendText: () => {},
          getTextWithResourceURIs: () => ({ text: "", resourceNames: {} }),
          hasMention: () => false,
          insertMention: () => {},
          setEditable: () => {},
        };
      }

      return {
        focus: (position?: "start" | "end") => {
          if (position) {
            editor.commands.focus(position);
          } else {
            editor.commands.focus();
          }
        },
        setContent: (content: string) => {
          editor.commands.setContent(content);
        },
        appendText: (text: string) => {
          editor.chain().focus("end").insertContent(text).run();
        },
        getTextWithResourceURIs: () => getTextWithResourceURIs(editor),
        hasMention: (id: string) => {
          if (!editor.state?.doc) return false;
          let exists = false;
          editor.state.doc.descendants((node) => {
            if (node.type.name === "mention") {
              const mentionId = node.attrs.id as string;
              if (mentionId === id) {
                exists = true;
                return false;
              }
            }
            return true;
          });
          return exists;
        },
        insertMention: (id: string, label: string) => {
          editor
            .chain()
            .focus()
            .insertContent([
              { type: "mention", attrs: { id, label } },
              { type: "text", text: " " },
            ])
            .run();
        },
        setEditable: (editable: boolean) => {
          editor.setEditable(editable);
        },
      };
    }, [editor]);

    const lastSyncedValueRef = React.useRef<string>(value);

    React.useEffect(() => {
      if (!editor) return;

      const { text: currentText } = getTextWithResourceURIs(editor);

      if (value !== currentText && value !== lastSyncedValueRef.current) {
        editor.commands.setContent(value);
        lastSyncedValueRef.current = value;
      } else if (value === currentText) {
        lastSyncedValueRef.current = value;
      }

      editor.setEditable(!disabled);
    }, [editor, value, disabled]);

    return (
      <div className="w-full">
        <SuggestionPopover
          state={resourceState}
          onClose={() => resourceRef.current.setState({ isOpen: false })}
          defaultIcon={<Cuboid className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No results found"
          monoSecondary
        />
        <SuggestionPopover
          state={promptState}
          onClose={() => promptRef.current.setState({ isOpen: false })}
          defaultIcon={<FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No prompts found"
        />
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";    "use client";

import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  type TamboThread,
  useTamboThread,
  useTamboThreadList,
} from "@tambo-ai/react";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  MoreHorizontal,
  Pencil,
  PlusIcon,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import React, { useMemo } from "react";

/**
 * Context for sharing thread history state and functions
 */
interface ThreadHistoryContextValue {
  threads: { items?: TamboThread[] } | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  currentThread: TamboThread;
  switchCurrentThread: (threadId: string) => void;
  startNewThread: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onThreadChange?: () => void;
  position?: "left" | "right";
  updateThreadName: (newName: string, threadId?: string) => Promise<void>;
  generateThreadName: (threadId: string) => Promise<TamboThread>;
}

const ThreadHistoryContext =
  React.createContext<ThreadHistoryContextValue | null>(null);

const useThreadHistoryContext = () => {
  const context = React.useContext(ThreadHistoryContext);
  if (!context) {
    throw new Error(
      "ThreadHistory components must be used within ThreadHistory",
    );
  }
  return context;
};

/**
 * Root component that provides context for thread history
 */
interface ThreadHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
  onThreadChange?: () => void;
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
  position?: "left" | "right";
}

const ThreadHistory = React.forwardRef<HTMLDivElement, ThreadHistoryProps>(
  (
    {
      className,
      onThreadChange,
      defaultCollapsed = true,
      position = "left",
      children,
      ...props
    },
    ref,
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [shouldFocusSearch, setShouldFocusSearch] = React.useState(false);

    const { data: threads, isLoading, error, refetch } = useTamboThreadList();

    const {
      switchCurrentThread,
      startNewThread,
      thread: currentThread,
      updateThreadName,
      generateThreadName,
    } = useTamboThread();

    // Update CSS variable when sidebar collapses/expands
    React.useEffect(() => {
      const sidebarWidth = isCollapsed ? "3rem" : "16rem";
      document.documentElement.style.setProperty(
        "--sidebar-width",
        sidebarWidth,
      );
    }, [isCollapsed]);

    // Focus search input when expanded from collapsed state
    React.useEffect(() => {
      if (!isCollapsed && shouldFocusSearch) {
        setShouldFocusSearch(false);
      }
    }, [isCollapsed, shouldFocusSearch]);

    const contextValue = React.useMemo(
      () => ({
        threads,
        isLoading,
        error,
        refetch,
        currentThread,
        switchCurrentThread,
        startNewThread,
        searchQuery,
        setSearchQuery,
        isCollapsed,
        setIsCollapsed,
        onThreadChange,
        position,
        updateThreadName,
        generateThreadName,
      }),
      [
        threads,
        isLoading,
        error,
        refetch,
        currentThread,
        switchCurrentThread,
        startNewThread,
        searchQuery,
        isCollapsed,
        onThreadChange,
        position,
        updateThreadName,
        generateThreadName,
      ],
    );

    return (
      <ThreadHistoryContext.Provider
        value={contextValue as ThreadHistoryContextValue}
      >
        <div
          ref={ref}
          className={cn(
            "border-flat bg-container h-full transition-all duration-300 flex-none",
            position === "left" ? "border-r" : "border-l",
            isCollapsed ? "w-12" : "w-64",
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "flex flex-col h-full",
              isCollapsed ? "py-4 px-2" : "p-4",
            )} // py-4 px-2 is for better alignment when isCollapsed
          >
            {children}
          </div>
        </div>
      </ThreadHistoryContext.Provider>
    );
  },
);
ThreadHistory.displayName = "ThreadHistory";

/**
 * Header component with title and collapse toggle
 */
const ThreadHistoryHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    isCollapsed,
    setIsCollapsed,
    position = "left",
  } = useThreadHistoryContext();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center mb-4 relative",
        isCollapsed ? "p-1" : "p-1",
        className,
      )}
      {...props}
    >
      <h2
        className={cn(
          "text-sm text-muted-foreground whitespace-nowrap ",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden "
            : "opacity-100 max-w-none transition-all duration-300 delay-75",
        )}
      >
        Tambo Conversations
      </h2>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          `bg-container p-1 hover:bg-backdrop transition-colors rounded-md cursor-pointer absolute flex items-center justify-center`,
          position === "left" ? "right-1" : "left-0",
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ArrowRightToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        ) : (
          <ArrowLeftToLine
            className={cn("h-4 w-4", position === "right" && "rotate-180")}
          />
        )}
      </button>
    </div>
  );
});
ThreadHistoryHeader.displayName = "ThreadHistory.Header";

/**
 * Button to create a new thread
 */
const ThreadHistoryNewButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ ...props }, ref) => {
  const { isCollapsed, startNewThread, refetch, onThreadChange } =
    useThreadHistoryContext();

  const handleNewThread = React.useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      try {
        await startNewThread();
        await refetch();
        onThreadChange?.();
      } catch (error) {
        console.error("Failed to create new thread:", error);
      }
    },
    [startNewThread, refetch, onThreadChange],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        void handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewThread]);

  return (
    <button
      ref={ref}
      onClick={handleNewThread}
      className={cn(
        "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
        isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
      )}
      title="New thread"
      {...props}
    >
      <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white" />
      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px] ",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
            : "opacity-100 transition-all duration-300 delay-100",
        )}
      >
        New thread
      </span>
    </button>
  );
});
ThreadHistoryNewButton.displayName = "ThreadHistory.NewButton";

/**
 * Search input for filtering threads
 */
const ThreadHistorySearch = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed, setIsCollapsed, searchQuery, setSearchQuery } =
    useThreadHistoryContext();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const expandOnSearch = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Wait for animation
    }
  };

  return (
    <div ref={ref} className={cn("mb-4 relative", className)} {...props}>
      {/*visible when collapsed */}
      <button
        onClick={expandOnSearch}
        className={cn(
          "p-1 hover:bg-backdrop rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2",
          isCollapsed
            ? "opacity-100 pointer-events-auto transition-all duration-300"
            : "opacity-0 pointer-events-none",
        )}
        title="Search threads"
      >
        <SearchIcon className="h-4 w-4 text-gray-400" />
      </button>

      {/*visible when expanded with delay */}

      <div
        className={cn(
          //using this as wrapper
          isCollapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100 delay-100 transition-all duration-500",
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
});
ThreadHistorySearch.displayName = "ThreadHistory.Search";

/**
 * List of thread items
 */
const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const {
    threads,
    isLoading,
    error,
    isCollapsed,
    searchQuery,
    currentThread,
    switchCurrentThread,
    onThreadChange,
    updateThreadName,
    generateThreadName,
    refetch,
  } = useThreadHistoryContext();

  const [editingThread, setEditingThread] = React.useState<TamboThread | null>(
    null,
  );
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle click outside name editing input
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingThread &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setEditingThread(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingThread]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (editingThread) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editingThread]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingThread(null);
    }
  };

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    // While collapsed we do not need the list, avoid extra work.
    if (isCollapsed) return [];

    if (!threads?.items) return [];

    const query = searchQuery.toLowerCase();
    return threads.items.filter((thread: TamboThread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);

      return idMatches ? true : nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const handleSwitchThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      switchCurrentThread(threadId);
      onThreadChange?.();
    } catch (error) {
      console.error("Failed to switch thread:", error);
    }
  };

  const handleRename = (thread: TamboThread) => {
    setEditingThread(thread);
    setNewName(thread.name ?? "");
  };

  const handleGenerateName = async (thread: TamboThread) => {
    try {
      await generateThreadName(thread.id);
      await refetch();
    } catch (error) {
      console.error("Failed to generate name:", error);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;

    try {
      await updateThreadName(newName, editingThread.id);
      await refetch();
      setEditingThread(null);
    } catch (error) {
      console.error("Failed to rename thread:", error);
    }
  };

  // Content to show
  let content;
  if (isLoading) {
    content = (
      <div
        ref={ref}
        className={cn("text-sm text-muted-foreground p-2", className)}
        {...props}
      >
        Loading threads...
      </div>
    );
  } else if (error) {
    content = (
      <div
        ref={ref}
        className={cn(
          `text-sm text-destructive p-2 whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100"}`,
          className,
        )}
        {...props}
      >
        Error loading threads
      </div>
    );
  } else if (filteredThreads.length === 0) {
    content = (
      <div
        ref={ref}
        className={cn(
          `text-sm text-muted-foreground p-2 whitespace-nowrap ${isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100"}`,
          className,
        )}
        {...props}
      >
        {searchQuery ? "No matching threads" : "No previous threads"}
      </div>
    );
  } else {
    content = (
      <div className="space-y-1">
        {filteredThreads.map((thread: TamboThread) => (
          <div
            key={thread.id}
            onClick={async () => await handleSwitchThread(thread.id)}
            className={cn(
              "p-2 rounded-md hover:bg-backdrop cursor-pointer group flex items-center justify-between",
              currentThread?.id === thread.id ? "bg-muted" : "",
              editingThread?.id === thread.id ? "bg-muted" : "",
            )}
          >
            <div className="text-sm flex-1">
              {editingThread?.id === thread.id ? (
                <form
                  onSubmit={handleNameSubmit}
                  className="flex flex-col gap-1"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background px-1 text-sm font-medium focus:outline-none rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Thread name..."
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </form>
              ) : (
                <>
                  <span className="font-medium line-clamp-1">
                    {thread.name ?? `Thread ${thread.id.substring(0, 8)}`}
                  </span>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </>
              )}
            </div>
            <ThreadOptionsDropdown
              thread={thread}
              onRename={handleRename}
              onGenerateName={handleGenerateName}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "opacity-0 max-h-0 overflow-hidden pointer-events-none"
          : "opacity-100 max-h-full pointer-events-auto",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
});
ThreadHistoryList.displayName = "ThreadHistory.List";

/**
 * Dropdown menu component for thread actions
 */
const ThreadOptionsDropdown = ({
  thread,
  onRename,
  onGenerateName,
}: {
  thread: TamboThread;
  onRename: (thread: TamboThread) => void;
  onGenerateName: (thread: TamboThread) => void;
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 hover:bg-backdrop rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] text-xs bg-popover rounded-md p-1 shadow-md border border-border"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-2 py-1.5 text-foreground hover:bg-backdrop rounded-sm cursor-pointer outline-none transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRename(thread);
            }}
          >
            <Pencil className="h-3 w-3" />
            Rename
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-2 py-1.5 text-foreground hover:bg-backdrop rounded-sm cursor-pointer outline-none transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateName(thread);
            }}
          >
            <Sparkles className="h-3 w-3" />
            Generate Name
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadOptionsDropdown,
};     "use client";

import { cn } from "@/lib/utils";
import {
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useId, useMemo, useState } from "react";

type FieldSchema =
  TamboElicitationRequest["requestedSchema"]["properties"][string];

/**
 * Props for individual field components
 */
interface FieldProps {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  autoFocus?: boolean;
  validationError?: string | null;
}

/**
 * Boolean field component - renders yes/no buttons
 */
const BooleanField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  const boolValue = value as boolean | undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus={autoFocus}
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === true
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === false
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
};

/**
 * Enum field component - renders button for each choice
 */
const EnumField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  if (schema.type !== "string" || !("enum" in schema)) {
    return null;
  }
  const options = schema.enum ?? [];
  const optionNames =
    "enumNames" in schema ? (schema.enumNames ?? []) : options;
  const stringValue = value as string | undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            autoFocus={autoFocus && index === 0}
            onClick={() => onChange(option)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              stringValue === option
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            {optionNames[index] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * String field component - renders text input with validation
 */
const StringField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  const inputId = useId();
  if (schema.type !== "string") {
    return null;
  }
  const stringValue = (value as string | undefined) ?? "";

  // Map JSON Schema format to HTML5 input type
  const getInputType = (): string => {
    const format = "format" in schema ? schema.format : undefined;
    switch (format) {
      case "email":
        return "email";
      case "uri":
        return "url";
      case "date":
        return "date";
      case "date-time":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const inputType = getInputType();
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={inputType}
        autoFocus={autoFocus}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          hasError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-accent",
        )}
        placeholder={schema.description ?? name}
        minLength={"minLength" in schema ? schema.minLength : undefined}
        maxLength={"maxLength" in schema ? schema.maxLength : undefined}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {validationError && (
        <p id={errorId} className="text-xs text-destructive" aria-live="polite">
          {validationError}
        </p>
      )}
    </div>
  );
};

/**
 * Number field component - renders number input with validation
 */
const NumberField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  const inputId = useId();
  if (schema.type !== "number" && schema.type !== "integer") {
    return null;
  }
  const numberSchema = schema;
  const numberValue = value as number | undefined;
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type="number"
        autoFocus={autoFocus}
        value={numberValue ?? ""}
        onChange={(e) => {
          const { value, valueAsNumber } = e.currentTarget;
          onChange(
            value === "" || Number.isNaN(valueAsNumber)
              ? undefined
              : valueAsNumber,
          );
        }}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          hasError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-accent",
        )}
        placeholder={schema.description ?? name}
        min={numberSchema.minimum}
        max={numberSchema.maximum}
        step={numberSchema.type === "integer" ? 1 : "any"}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {validationError && (
        <p id={errorId} className="text-xs text-destructive" aria-live="polite">
          {validationError}
        </p>
      )}
    </div>
  );
};

/**
 * Generic field component that renders the appropriate input based on schema type
 */
const Field: React.FC<FieldProps> = (props) => {
  const { schema } = props;

  if (schema.type === "boolean") {
    return <BooleanField {...props} />;
  }

  if (schema.type === "string" && "enum" in schema) {
    return <EnumField {...props} />;
  }

  if (schema.type === "string") {
    return <StringField {...props} />;
  }

  if (schema.type === "number" || schema.type === "integer") {
    return <NumberField {...props} />;
  }

  return null;
};

/**
 * Determines if the elicitation should use single-entry mode
 * (one field that is boolean or enum)
 */
function isSingleEntryMode(request: TamboElicitationRequest): boolean {
  const fields = Object.entries(request.requestedSchema.properties);

  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];

  return (
    schema.type === "boolean" || (schema.type === "string" && "enum" in schema)
  );
}

/**
 * Unified validation function that returns both validity and a user-facing message.
 * Avoids drift between boolean validation and error computation.
 */
function validateField(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): { valid: boolean; error: string | null } {
  // Required
  if (required && (value === undefined || value === "" || value === null)) {
    return { valid: false, error: "This field is required" };
  }

  // If empty and not required, it's valid
  if (!required && (value === undefined || value === "" || value === null)) {
    return { valid: true, error: null };
  }

  // String validation
  if (schema.type === "string") {
    const stringSchema = schema;
    const stringValue = String(value);

    if (
      "minLength" in stringSchema &&
      stringSchema.minLength !== undefined &&
      stringValue.length < stringSchema.minLength
    ) {
      return {
        valid: false,
        error: `Minimum length is ${stringSchema.minLength} characters`,
      };
    }

    if (
      "maxLength" in stringSchema &&
      stringSchema.maxLength !== undefined &&
      stringValue.length > stringSchema.maxLength
    ) {
      return {
        valid: false,
        error: `Maximum length is ${stringSchema.maxLength} characters`,
      };
    }

    if ("pattern" in stringSchema && stringSchema.pattern) {
      try {
        const regex = new RegExp(stringSchema.pattern as string);
        if (!regex.test(stringValue)) {
          return {
            valid: false,
            error: "Value does not match required pattern",
          };
        }
      } catch {
        // Invalid regex pattern, skip validation
      }
    }

    // Format validation
    if ("format" in stringSchema && stringSchema.format) {
      switch (stringSchema.format) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
            return {
              valid: false,
              error: "Please enter a valid email address",
            };
          }
          break;
        case "uri":
          try {
            new URL(stringValue);
          } catch {
            return { valid: false, error: "Please enter a valid URL" };
          }
          break;
      }
    }
  }

  // Number validation
  if (schema.type === "number" || schema.type === "integer") {
    const numberSchema = schema;
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return { valid: false, error: "Please enter a valid number" };
    }

    if (
      numberSchema.minimum !== undefined &&
      numberValue < numberSchema.minimum
    ) {
      return {
        valid: false,
        error: `Minimum value is ${numberSchema.minimum}`,
      };
    }

    if (
      numberSchema.maximum !== undefined &&
      numberValue > numberSchema.maximum
    ) {
      return {
        valid: false,
        error: `Maximum value is ${numberSchema.maximum}`,
      };
    }

    if (schema.type === "integer" && !Number.isInteger(numberValue)) {
      return { valid: false, error: "Please enter a whole number" };
    }
  }

  return { valid: true, error: null };
}

// Backwards-compatible helpers that delegate to the unified validator
function getValidationError(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): string | null {
  return validateField(value, schema, required).error;
}

/**
 * Props for the ElicitationUI component
 */
export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}

/**
 * Main elicitation UI component
 * Handles both single-entry and multiple-entry modes
 */
export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  const singleEntry = isSingleEntryMode(request);
  const fields = useMemo(
    () => Object.entries(request.requestedSchema.properties),
    [request.requestedSchema.properties],
  );
  const requiredFields = useMemo(
    () => request.requestedSchema.required ?? [],
    [request.requestedSchema.required],
  );
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    fields.forEach(([name, schema]) => {
      if (schema.default !== undefined) {
        initial[name] = schema.default;
      }
    });
    return initial;
  });

  // Initialize form data with defaults
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Mark field as touched so we can show validation errors
    setTouchedFields((prev) => new Set(prev).add(name));
  };

  const handleAccept = () => {
    // Check if valid before submitting
    if (!isValid) {
      // Mark all fields as touched to show validation errors
      setTouchedFields(new Set(fields.map(([name]) => name)));
      return;
    }
    onResponse({ action: "accept", content: formData });
  };

  const handleDecline = () => {
    onResponse({ action: "decline" });
  };

  const handleCancel = () => {
    onResponse({ action: "cancel" });
  };

  // For single-entry mode with boolean/enum, clicking the option submits immediately
  const handleSingleEntryChange = (name: string, value: unknown) => {
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    // Mark as touched for consistency/future-proofing
    setTouchedFields((prev) => new Set(prev).add(name));
    // Submit immediately
    onResponse({ action: "accept", content: updatedData });
  };

  // Check if form is valid (all fields pass validation)
  const isValid = fields.every(([fieldName, fieldSchema]) => {
    const value = formData[fieldName];
    const isRequired = requiredFields.includes(fieldName);
    return validateField(value, fieldSchema, isRequired).valid;
  });

  if (singleEntry) {
    const [fieldName, fieldSchema] = fields[0];
    const validationError = touchedFields.has(fieldName)
      ? getValidationError(
          formData[fieldName],
          fieldSchema,
          requiredFields.includes(fieldName),
        )
      : null;

    return (
      <div
        className={cn(
          "flex flex-col rounded-xl bg-background border border-border p-4 space-y-3",
          className,
        )}
      >
        <div className="text-base font-semibold text-foreground mb-2">
          {request.message}
        </div>
        <Field
          name={fieldName}
          schema={fieldSchema}
          value={formData[fieldName]}
          onChange={(value) => handleSingleEntryChange(fieldName, value)}
          required={requiredFields.includes(fieldName)}
          autoFocus
          validationError={validationError}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  }

  // Multiple-entry mode
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-background border border-border p-4 space-y-4",
        className,
      )}
    >
      <div className="text-base font-semibold text-foreground">
        {request.message}
      </div>
      <div className="space-y-3">
        {fields.map(([name, schema], index) => {
          const validationError = touchedFields.has(name)
            ? getValidationError(
                formData[name],
                schema,
                requiredFields.includes(name),
              )
            : null;

          return (
            <Field
              key={name}
              name={name}
              schema={schema}
              value={formData[name]}
              onChange={(value) => handleFieldChange(name, value)}
              required={requiredFields.includes(name)}
              autoFocus={index === 0}
              validationError={validationError}
            />
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={!isValid}
          className="px-6 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
};   "use client";

import { cn } from "@/lib/utils";
import { type GenerationStage, useTambo } from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

/**
 * Represents the generation stage of a message
 * @property {string} className - Optional className for custom styling
 * @property {boolean} showLabel - Whether to show the label
 */

export interface GenerationStageProps extends React.HTMLAttributes<HTMLDivElement> {
  showLabel?: boolean;
}

export function MessageGenerationStage({
  className,
  showLabel = true,
  ...props
}: GenerationStageProps) {
  const { thread, isIdle } = useTambo();
  const stage = thread?.generationStage;

  // Only render if we have a generation stage
  if (!stage) {
    return null;
  }

  // Map stage names to more user-friendly labels
  const stageLabels: Record<GenerationStage, string> = {
    IDLE: "Idle",
    CHOOSING_COMPONENT: "Choosing component",
    FETCHING_CONTEXT: "Fetching context",
    HYDRATING_COMPONENT: "Preparing component",
    STREAMING_RESPONSE: "Generating response",
    COMPLETE: "Complete",
    ERROR: "Error",
    CANCELLED: "Cancelled",
  };

  const label =
    stageLabels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);

  if (isIdle) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md bg-transparent text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Loader2Icon className="h-3 w-3 animate-spin" />
      {showLabel && <span>{label}</span>}
    </div>
  );
}    "use client";

import { MessageGenerationStage } from "./message-generation-stage";
import { Tooltip, TooltipProvider } from "./suggestions-tooltip";
import { cn } from "@/lib/utils";
import type { Suggestion, TamboThread } from "@tambo-ai/react";
import {
  GenerationStage,
  useTambo,
  useTamboSuggestions,
} from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * @typedef MessageSuggestionsContextValue
 * @property {Array} suggestions - Array of suggestion objects
 * @property {string|null} selectedSuggestionId - ID of the currently selected suggestion
 * @property {function} accept - Function to accept a suggestion
 * @property {boolean} isGenerating - Whether suggestions are being generated
 * @property {Error|null} error - Any error from generation
 * @property {object} thread - The current Tambo thread
 */
interface MessageSuggestionsContextValue {
  suggestions: Suggestion[];
  selectedSuggestionId: string | null;
  accept: (options: { suggestion: Suggestion }) => Promise<void>;
  isGenerating: boolean;
  error: Error | null;
  thread: TamboThread;
  isMac: boolean;
}

/**
 * React Context for sharing suggestion data and functions among sub-components.
 * @internal
 */
const MessageSuggestionsContext =
  React.createContext<MessageSuggestionsContextValue | null>(null);

/**
 * Hook to access the message suggestions context.
 * @returns {MessageSuggestionsContextValue} The message suggestions context value.
 * @throws {Error} If used outside of MessageSuggestions.
 * @internal
 */
const useMessageSuggestionsContext = () => {
  const context = React.useContext(MessageSuggestionsContext);
  if (!context) {
    throw new Error(
      "MessageSuggestions sub-components must be used within a MessageSuggestions",
    );
  }
  return context;
};

/**
 * Props for the MessageSuggestions component.
 * Extends standard HTMLDivElement attributes.
 */
export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of suggestions to display (default: 3) */
  maxSuggestions?: number;
  /** The child elements to render within the container. */
  children?: React.ReactNode;
  /** Pre-seeded suggestions to display initially */
  initialSuggestions?: Suggestion[];
}

/**
 * The root container for message suggestions.
 * It establishes the context for its children and handles overall state management.
 * @component MessageSuggestions
 * @example
 * ```tsx
 * <MessageSuggestions maxSuggestions={3}>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(
  (
    {
      children,
      className,
      maxSuggestions = 3,
      initialSuggestions = [],
      ...props
    },
    ref,
  ) => {
    const { thread } = useTambo();
    const {
      suggestions: generatedSuggestions,
      selectedSuggestionId,
      accept,
      generateResult: { isPending: isGenerating, error },
    } = useTamboSuggestions({ maxSuggestions });

    // Combine initial and generated suggestions, but only use initial ones when thread is empty
    const suggestions = React.useMemo(() => {
      // Only use pre-seeded suggestions if thread is empty
      if (!thread?.messages?.length && initialSuggestions.length > 0) {
        return initialSuggestions.slice(0, maxSuggestions);
      }
      // Otherwise use generated suggestions
      return generatedSuggestions;
    }, [
      thread?.messages?.length,
      generatedSuggestions,
      initialSuggestions,
      maxSuggestions,
    ]);

    const isMac =
      typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

    // Track the last AI message ID to detect new messages
    const lastAiMessageIdRef = useRef<string | null>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const contextValue = React.useMemo(
      () => ({
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      }),
      [
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      ],
    );

    // Find the last AI message
    const lastAiMessage = thread?.messages
      ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
      : null;

    // When a new AI message appears, update the reference
    useEffect(() => {
      if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
        lastAiMessageIdRef.current = lastAiMessage.id;

        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = setTimeout(() => {}, 5000);
      }

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }, [lastAiMessage, suggestions.length]);

    // Handle keyboard shortcuts for selecting suggestions
    useEffect(() => {
      if (!suggestions || suggestions.length === 0) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        const modifierPressed = isMac
          ? event.metaKey && event.altKey
          : event.ctrlKey && event.altKey;

        if (modifierPressed) {
          const keyNum = parseInt(event.key);
          if (!isNaN(keyNum) && keyNum > 0 && keyNum <= suggestions.length) {
            event.preventDefault();
            const suggestionIndex = keyNum - 1;
            void accept({ suggestion: suggestions[suggestionIndex] });
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [suggestions, accept, isMac]);

    // If we have no messages yet and no initial suggestions, render nothing
    if (!thread?.messages?.length && initialSuggestions.length === 0) {
      return null;
    }

    return (
      <MessageSuggestionsContext.Provider value={contextValue}>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn("px-4 pb-2", className)}
            data-slot="message-suggestions-container"
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </MessageSuggestionsContext.Provider>
    );
  },
);
MessageSuggestions.displayName = "MessageSuggestions";

/**
 * Props for the MessageSuggestionsStatus component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageSuggestionsStatusProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays loading, error, or generation stage information.
 * Automatically connects to the context to show the appropriate status.
 * @component MessageSuggestions.Status
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsStatusProps
>(({ className, ...props }, ref) => {
  const { error, isGenerating, thread } = useMessageSuggestionsContext();

  return (
    <div
      ref={ref}
      className={cn(
        "p-2 rounded-md text-sm bg-transparent",
        !error &&
          !isGenerating &&
          (!thread?.generationStage ||
            thread.generationStage === GenerationStage.COMPLETE)
          ? "p-0 min-h-0 mb-0"
          : "",
        className,
      )}
      data-slot="message-suggestions-status"
      {...props}
    >
      {/* Error state */}
      {error && (
        <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
          <p>{error.message}</p>
        </div>
      )}

      {/* Always render a container for generation stage to prevent layout shifts */}
      <div className="generation-stage-container">
        <GenerationStageContent
          generationStage={thread?.generationStage}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
});
MessageSuggestionsStatus.displayName = "MessageSuggestions.Status";

/**
 * Internal component to render generation stage content
 */
function GenerationStageContent({
  generationStage,
  isGenerating,
}: {
  generationStage?: string;
  isGenerating: boolean;
}) {
  if (generationStage && generationStage !== GenerationStage.COMPLETE) {
    return <MessageGenerationStage />;
  }
  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        <p>Generating suggestions...</p>
      </div>
    );
  }
  return null;
}

/**
 * Props for the MessageSuggestionsList component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageSuggestionsListProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays the list of suggestion buttons.
 * Automatically connects to the context to show the suggestions.
 * @component MessageSuggestions.List
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsListProps
>(({ className, ...props }, ref) => {
  const { suggestions, selectedSuggestionId, accept, isGenerating, isMac } =
    useMessageSuggestionsContext();

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  // Create placeholder suggestions when there are no real suggestions
  const placeholders = Array(3).fill(null);

  return (
    <div
      ref={ref}
      className={cn(
        "flex space-x-2 overflow-x-auto pb-2 rounded-md bg-transparent min-h-[2.5rem]",
        isGenerating ? "opacity-70" : "",
        className,
      )}
      data-slot="message-suggestions-list"
      {...props}
    >
      {suggestions.length > 0
        ? suggestions.map((suggestion, index) => (
            <Tooltip
              key={suggestion.id}
              content={
                <span suppressHydrationWarning>
                  {modKey}+{altKey}+{index + 1}
                </span>
              }
              side="top"
            >
              <button
                className={cn(
                  "py-2 px-2.5 rounded-2xl text-xs transition-colors",
                  "border border-flat",
                  getSuggestionButtonClassName({
                    isGenerating,
                    isSelected: selectedSuggestionId === suggestion.id,
                  }),
                )}
                onClick={async () =>
                  !isGenerating && (await accept({ suggestion }))
                }
                disabled={isGenerating}
                data-suggestion-id={suggestion.id}
                data-suggestion-index={index}
              >
                <span className="font-medium">{suggestion.title}</span>
              </button>
            </Tooltip>
          ))
        : // Render placeholder buttons when no suggestions are available
          placeholders.map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className="py-2 px-2.5 rounded-2xl text-xs border border-flat bg-muted/20 text-transparent animate-pulse"
              data-placeholder-index={index}
            >
              <span className="invisible">Placeholder</span>
            </div>
          ))}
    </div>
  );
});
MessageSuggestionsList.displayName = "MessageSuggestions.List";

/**
 * Internal function to get className for suggestion button based on state
 */
function getSuggestionButtonClassName({
  isGenerating,
  isSelected,
}: {
  isGenerating: boolean;
  isSelected: boolean;
}) {
  if (isGenerating) {
    return "bg-muted/50 text-muted-foreground";
  }
  if (isSelected) {
    return "bg-accent text-accent-foreground";
  }
  return "bg-background hover:bg-accent hover:text-accent-foreground";
}

export { MessageSuggestions, MessageSuggestionsList, MessageSuggestionsStatus }; 