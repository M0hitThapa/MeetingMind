this is ho we refirster tambo component Components are registered with Tambo either statically (at app startup) or dynamically (at runtime). Registration provides Tambo with:

The React component to render
A name and description for identification
A Zod schema defining valid props

const components: TamboComponent[] = [
  {
    name: "DataChart",
    description: "Displays data as a chart",
    component: DataChart,
    propsSchema: z.object({
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
        }),
      ),
      type: z.enum(["bar", "line", "pie"]),
    }),
  },
];
2. Component Selection
When a user sends a message, Tambo analyzes the request and available registered components. It uses the component's name and description to determine if a component is appropriate for the user's intent.

Tambo considers:

The semantic meaning of the user's message
Component descriptions and names
The conversation context and history
Available tools and resources
3. Props Generation
Once Tambo selects a component, it generates props that match the component's schema. The Zod schema acts as both validation and guidance:

Required fields: Tambo must provide values for all non-optional fields
Optional fields: Tambo may omit optional fields (marked with .optional())
Type constraints: Enum values, number ranges, and string formats guide generation
Descriptions: z.describe() provides hints about expected formats or usage patterns

// Schema with descriptions helps Tambo generate better props
const DataChartProps = z.object({
  data: z.array(
    z.object({
      label: z.string().describe("Short label text, 1-3 words"),
      value: z.number().describe("Numeric value for the data point"),
    }),
  ),
  type: z
    .enum(["bar", "line", "pie"])
    .describe("Use bar for comparisons, line for trends, pie for proportions"),
});
4. Component Rendering
Tambo renders the selected component with generated props as part of the assistant's message. The component appears inline in the conversation thread, creating a visual response alongside any text. Components rendered in messages become part of the conversation history, allowing Tambo to reference them in future messages.

Generative vs. Interactable Components
Understanding when to use each type helps you design effective Tambo applications:

Aspect	Generative Components	Interactable Components
Placement	Created by Tambo in messages	Pre-placed by you in your UI
Lifecycle	New instance per message	Persistent, updates in place
Use Case	Charts, summaries, one-time displays	Shopping carts, forms, persistent state
Registration	Via TamboProvider or registerComponent()	Via withInteractable() HOC
Updates	New message = new component	Same component, updated props
Example scenarios:

Generative: User asks "Show me sales data as a chart" → Tambo creates a new DataChart component
Interactable: User has a shopping cart on the page → User asks "Add 3 more items" → Tambo updates the existing cart component's props
You can use both together: register a component as generative for on-demand creation, and also make it interactable for persistent instances.   and this is how we do that New Project
Existing Project
Add tambo-ai to an existing project
01: Install tambo-ai
Run the full-send command to setup your project. This command will setup your project, get an API key, and install components.

~/your-project
$
npx tambo full-send

02: Add TamboProvider
Update your layout.tsx file. Wrap your app with TamboProvider to enable tambo features.

~/your-project/src/app/layout.tsx
"use client";
  
  import { TamboProvider } from "@tambo-ai/react";
  
  export default function RootLayout({ children }) {
    return (
      <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
        {children}
      </TamboProvider>
    );
  }

03: Add MessageThreadFull
Import and use the chat component. Add a complete chat interface to your application.

~/your-project/src/app/page.tsx
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
  
  export default function Home() {
    return (
      <main>
        <MessageThreadFull />
      </main>
    );
  }

04: Register Components
Register your components with Tambo. Register your components with Tambo to make them available for AI-driven rendering.

~/your-project/src/app/layout.tsx
"use client";
  
  import { TamboProvider } from "@tambo-ai/react";
  import { z } from "zod/v3";
  import { MyComponent } from "@/components/MyComponent";
  
  // Define component props schema
  const MyComponentProps = z.object({
    title: z.string(),
    data: z.array(z.number())
  });
  
  const components = [
    {
      name: "MyComponent",
      description: "Displays data in my component",
      component: MyComponent,
      propsSchema: MyComponentProps,
    }
  ];
  
  export default function RootLayout({ children }) {
    return (
      <TamboProvider 
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
        components={components}
      >
        {children}
      </TamboProvider>
    );
  }  and   this is how to do conversation storage Every conversation with Tambo is automatically stored. When a user sends a message, Tambo persists the message content, any additional context, and the complete response including text, tool calls, and generated components. You don't need to configure databases or write persistence logic. Conversations are immediately available through the React SDK and visible in your project dashboard.

This automatic persistence enables users to return to previous conversations, and the full conversation history informs future Tambo responses.

What Gets Stored
Threads
Threads are the containers for conversations. Each thread tracks a single conversation with its own unique ID and maintains metadata about that conversation. A thread knows which project it belongs to, when it was created and last updated, and what stage of generation it's currently in (idle, processing, complete, or error).

Threads can include optional metadata like custom properties or a context key for organizing related conversations. When Tambo is generating a response, the thread tracks what stage it's in and provides a human-readable status message describing what's happening.

Messages
Messages are the actual content within threads. Each message belongs to a specific thread and has a role indicating who sent it: the user, Tambo (assistant), the system (for instructions), or a tool (for function results).

Messages contain content parts that can be text, images, audio, or other media types. When Tambo responds with a generative component, the component definition and props are attached to the message. This allows the component to be re-rendered when loading conversation history.

If components use useTamboComponentState to track state, that state is also persisted with the message. When re-rendering a thread, components restore their state from storage, showing users exactly what they last saw.

Messages can also include additional context that was provided when they were sent, any errors that occurred during generation, and metadata like whether the message was cancelled.

Accessing Stored Conversations
Through the React SDK
The React SDK provides hooks for accessing stored conversations. Use useTamboThread() to work with the current thread, or useTamboThreads() to access all threads for a user:


import { useTamboThread, useTamboThreads } from "@tambo-ai/react";
// Access current thread and its messages
const { thread } = useTamboThread();
// Access all stored threads for the current project
const { data: threads, isLoading, error, refetch } = useTamboThreadList();
The SDK automatically fetches thread data, provides real-time updates as new messages arrive, caches data to minimize network requests, and triggers re-renders when thread state changes.

Through the Project Dashboard
Your Tambo Cloud dashboard provides visibility into all conversations stored in your project. You can see the list of all threads, view complete message history for each thread, check thread status and metadata, and search or filter conversations. This is useful for monitoring how users interact with your application and debugging issues.

Building Conversation Interfaces
Tambo offers pre-built UI components for common conversation patterns like chat interfaces, thread navigation, and input forms. These connect directly to stored conversations and handle all data fetching and rendering automatically.

For custom interfaces, the React SDK provides direct access to stored conversation data. You can build any UI pattern (chat, canvas, dashboard, or hybrid) with full control over presentation while Tambo handles storage and retrieval.  and  this is how to work with interactable component When you want to place specific components on screen rather than letting Tambo choose which to show, but still want to allow your users to interact with them using natural language, use Tambo's Interactable components. Unlike generative components that Tambo creates on-demand when responding to messages, Interactable components are pre-placed by you while still allowing Tambo to modify their props when responding to users.

You place them, set their initial state, and users can interact with them directly like any other React component. Simultaneously, Tambo can observe their current props values and update them through natural language requests.

This creates a conversational interface where traditional UI manipulation and natural language interaction work together. A user might click and edit a note's title, then ask Tambo to "update the content of this note with today's meeting notes," both modifying the same component.

How Interactables Work
Interactables are normal React components that you build and then wrap with Tambo's withInteractable to give Tambo access to them.


import { withInteractable } from "@tambo-ai/react";
import { Note } from "./note";
import { NotePropsSchema } from "./note-schema";
export const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description:
    "A simple note component for recording ideas that can change title, content, and background color",
  propsSchema: NotePropsSchema,
});
When you wrap a component with withInteractable, Tambo creates an automatic bidirectional connection:

Automatic Context Sending: The current props of the component are visible to Tambo automatically.

Automatic Tool Registration: Update tools are automatically registered to allow Tambo to update the component's props when needed.

Place these wherever you normally would within the application to enable a traditional, statically-organized, user interface enhanced with AI capabilities.  and   Enable Generative UI
Octo Icon
Let Users Edit Components Through Chat
This guide helps you make pre-placed components editable by Tambo through natural language conversations.

Copy Markdown
Open
This guide shows you how to register React components as "Interactable" so Tambo can modify their props in response to user messages. Unlike generative components that Tambo creates on-demand, Interactable components are pre-placed by you and allow Tambo to update them in place.

Learn more about Interactable components
Understand what Interactable components are and when to use them
Step 1: Build Your React Component
Create a standard React component that accepts props.

If you're using useState and your component has state values that depend on the props, use useEffect to sync state with updated prop values as they stream in from Tambo.

If you want Tambo to be able to see and update state values rather than just props, replace useState with useTamboComponentState, and use the setFromProp parameter to sync state from props during streaming rather than useEffect.


import { useTamboComponentState } from "@tambo-ai/react";
type NoteProps = {
  title: string;
  content: string;
};
function Note({ title, content }: NoteProps) {
  // useTamboComponentState allows Tambo to see and update the draft content
  // The setFromProp parameter syncs state from props during streaming
  const [draftContent, setDraftContent] = useTamboComponentState(
    "draftContent",
    content,
    content,
  );
  return (
    <section className={`rounded-md p-4 bg-blue-500`}>
      <h3>{title}</h3>
      <textarea
        value={draftContent}
        onChange={(event) => setDraftContent(event.currentTarget.value)}
      />
    </section>
  );
}
Step 2: Define Your Props Schema
Create a Zod schema that describes which props Tambo can modify:


import { z } from "zod";
export const NotePropsSchema = z.object({
  title: z.string(),
  content: z.string(),
});
This schema tells Tambo:

Which props it can update
What types and values are valid
Which props are optional
Step 3: Wrap with withInteractable
Use withInteractable to create an Interactable version of your component:


import { withInteractable } from "@tambo-ai/react";
import { Note } from "./note";
import { NotePropsSchema } from "./note-schema";
export const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A simple note that can change title, and content",
  propsSchema: NotePropsSchema,
});
Configuration options:

componentName: Name Tambo uses to reference this component
description: What the component does (helps Tambo decide when to use it)
propsSchema: Zod schema defining editable props
Automatic Registration

Unlike generative components, Interactable components register themselves automatically when they mount. You don't need to add them to TamboProvider's components array.

Step 4: Render in Your App
Place the Interactable component in your app where you want it to appear, within the TamboProvider:


import { TamboProvider } from "@tambo-ai/react";
import { InteractableNote } from "./interactable-note";
function App() {
  return (
    <TamboProvider>
      <main>
        <InteractableNote
          title="Release plan"
          content="Ask Tambo to keep this note up to date."
        />
      </main>
    </TamboProvider>
  );
}
Tambo can now see and modify this component when users send messages like:

"Change the note title to 'Important Reminder'"
"Update the note content to 'Don't forget the meeting at 3pm'"
Complete Example
Here's a complete working example:


import {
  useTamboComponentState,
  withInteractable,
  TamboProvider,
} from "@tambo-ai/react";
import { z } from "zod";
// Step 1: Define Component
type NoteProps = {
  title: string;
  content: string;
};
function Note({ title, content }: NoteProps) {
  // useTamboComponentState allows Tambo to see and update the draft content
  // The setFromProp parameter syncs state from props during streaming
  const [draftContent, setDraftContent] = useTamboComponentState(
    "draftContent",
    content,
    content,
  );
  return (
    <section className={`rounded-md p-4 bg-blue-500`}>
      <h3>{title}</h3>
      <textarea
        value={draftContent}
        onChange={(event) => setDraftContent(event.currentTarget.value)}
      />
    </section>
  );
}
// Step 2 & 3: Schema and wrap with withInteractable
const NotePropsSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A simple note that can change title, and content",
  propsSchema: NotePropsSchema,
});
// Step 4: Use in app
export default function Page() {
  return (
    <TamboProvider>
      <main>
        <InteractableNote
          title="Release plan"
          content="Ask Tambo to keep this note up to date."
          color="yellow"
        />
      </main>
    </TamboProvider>
  );
}  # Give Tambo Components to Generate
URL: /guides/enable-generative-ui/register-components

import LearnMore from "@/components/learn-more";
import { BookOpen } from "lucide-react";

This guide shows you how to register your React components with Tambo so it can intelligently choose and render them in response to user messages. You'll see how to apply both static registration (at app startup) and dynamic registration (at runtime).

<LearnMore title="Learn more about generative components" description="Understand what generative components are and when to use them" href="/concepts/generative-interfaces/generative-components" icon={BookOpen} />

## Prerequisites

* A React component you want Tambo to use
* A Zod schema defining the component's props
* `@tambo-ai/react` installed in your project

## Step 1: Define Your Component Props Schema

Create a Zod schema that describes your component's props. This tells Tambo what data it needs to generate.

```tsx
import { z } from "zod";

export const WeatherCardPropsSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
  humidity: z.number().optional(),
});
```

<Callout type="info" title="Optional Props and Streaming">
  When using `.optional()` on a field, Tambo may not generate a value for that prop. Only mark props as optional if you truly want Tambo to sometimes omit them.

  **Important for streaming**: During streaming, all props (required and optional) start as `undefined` and populate as data arrives. Your component should handle undefined values gracefully by using optional prop types (`city?: string`) or providing default values in your component implementation.
</Callout>

The schema passed to Tambo must match the actual shape of the component's props, or Tambo may generate invalid props. One pattern to ensure this is to define the props based on the schema using `z.infer`:

```tsx
import { z } from "zod";

const WeatherCardPropsSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
  humidity: z.number().optional(),
});

type WeatherCardProps = z.infer<typeof WeatherCardPropsSchema>;

function WeatherCard({
  city,
  temperature,
  condition,
  humidity,
}: WeatherCardProps) {
  // Component implementation
}
```

## Step 2: Add Descriptions for Better AI Guidance

Use `z.describe()` to provide hints that help Tambo generate better prop values:

```tsx
import { z } from "zod";

export const WeatherCardPropsSchema = z
  .object({
    city: z.string().describe("City name to display, e.g., 'San Francisco'"),
    temperature: z
      .number()
      .describe("Temperature in Celsius as a whole number"),
    condition: z
      .string()
      .describe("Weather condition like 'Sunny', 'Cloudy', 'Rainy'"),
    humidity: z
      .number()
      .optional()
      .describe("Humidity percentage (0-100). Optional field."),
  })
  .describe("Displays current weather information for a city");
```

Descriptions help Tambo understand:

* What format to use for values
* When to use specific enum options
* Expected value ranges and formats

Use descriptive field names and helpful descriptions:

```tsx
// ✅ Good: Clear field names and guidance
z.object({
  city: z.string().describe("City name to display"),
  temperature: z.number().describe("Temperature in Celsius"),
  condition: z.string().describe("Weather condition description"),
});

// ❌ Poor: Generic names, no guidance
z.object({
  data: z.any(),
  value: z.string(),
});
```

## Step 3: Register Your Component with Tambo

Create a `TamboComponent` object including a reference to your component, the schema defined previously, a name, and a description of when to use the component.

```tsx
const weatherCardComponent: TamboComponent = {
  component: WeatherCard,
  name: "WeatherCard",
  description:
    "Displays current weather for a city. Use when the user asks about weather, temperature, or conditions.",
  propsSchema: WeatherCardPropsSchema,
};
```

Make sure the description explains both what the component does and when to use it to help Tambo use it appropriately:

```tsx
// ✅ Good: Clear purpose and usage
description: "Displays current weather for a city. Use when the user asks about weather, temperature, or conditions.";
// ❌ Poor: Too vague
description: "A weather component";
```

Finally, give Tambo access to it by registering it in one of two ways:

### Option A: Static Registration (Recommended for Most Cases)

Register components when your app initializes by passing them to `TamboProvider`:

```tsx
function App() {
  return (
    <TamboProvider components={[weatherCardComponent]}>
      <YourApp />
    </TamboProvider>
  );
}
```

**Use static registration when:**

* Components are available at app startup
* You want all components registered immediately

### Option B: Dynamic Registration

Register components at runtime using the `registerComponent` function from `useTamboRegistry`:

```tsx
import { useTamboRegistry } from "@tambo-ai/react";
import { useEffect } from "react";
import { weatherCardComponent } from "@/components/WeatherCard";

function MyComponent() {
  const { registerComponent } = useTamboRegistry();

  useEffect(() => {
    registerComponent(weatherCardComponent);
  }, [registerComponent]);

  return <YourUI />;
}
```

**Use dynamic registration when:**

* Components depend on runtime data or user context
* You want to conditionally register components
* Components are loaded asynchronously
* You need to register components based on thread state

## Step 4: Verify Registration

Once registered, Tambo can use your component in responses. When a user sends a message that matches your component's purpose, Tambo will generate it with appropriate props.

For example, if a user asks "What's the weather in Tokyo?", Tambo will render your `WeatherCard` component with generated weather data for Tokyo.

## Complete Example

Here's a complete example combining all steps:

```tsx
import { z } from "zod";
import { WeatherCard } from "@/components/WeatherCard";
import { TamboProvider } from "@tambo-ai/react";

// Step 1/2: Define schema with descriptions
export const WeatherCardPropsSchema = z
  .object({
    city: z.string().describe("City name to display, e.g., 'San Francisco'"),
    temperature: z
      .number()
      .describe("Temperature in Celsius as a whole number"),
    condition: z
      .string()
      .describe("Weather condition like 'Sunny', 'Cloudy', 'Rainy'"),
    humidity: z
      .number()
      .optional()
      .describe("Humidity percentage (0-100). Optional field."),
  })
  .describe("Displays current weather information for a city");

// Step 3: Registration via TamboProvider
const tamboComponents: TamboComponent[] = [
  {
    component: WeatherCard,
    name: "WeatherCard",
    description:
      "Displays current weather for a city. Use when the user asks about weather, temperature, or conditions.",
    propsSchema: WeatherCardPropsSchema,
  },
];

function App() {
  return (
    <TamboProvider components={tamboComponents}>
      <YourApp />
    </TamboProvider>
  );
}
```

<Callout type="info" title="Interactable Components">
  This registration approach is for generative components that Tambo creates on-demand. If you want to pre-place components on your page and let Tambo modify them, use [Interactable Components](/concepts/generative-interfaces/interactable-components) instead. They register themselves automatically when mounted.
</Callout>
 
Open
In a Tambo application, each user has their own threads and messages, isolated from other users' data. This user isolation is achieved through secure token-based authentication.

How Tambo Authentication Works
Tambo uses OAuth 2.0 Token Exchange to securely identify users. Here's what happens:

Your app authenticates the user with your chosen OAuth provider (Auth0, Clerk, etc.)
Your app receives a JWT token from the provider containing user information
Your app exchanges this token with Tambo via the /oauth/token endpoint
Tambo returns a Tambo-specific token that identifies the user for all subsequent API calls
Tambo API
OAuth Provider
Your App
User
Tambo API
OAuth Provider
Your App
User
Login request
Authenticate user
JWT Access Token
POST /oauth/token
(with JWT)
Tambo Token
API requests
(Authorization: Bearer {tambo-token})
User's threads & messages
Token Requirements
Tambo supports any OAuth 2.0 provider that issues a JSON Web Token (JWT) with:

A sub (subject) claim identifying the user
Proper signature for verification (when JWT verification is enabled)
This includes most popular providers like Google, Microsoft, Auth0, Clerk, and others.

Implementation Approaches
Server-Side Token Retrieval (Recommended)
Best for: Most applications, especially those requiring server-side rendering or enhanced security.

Tokens are retrieved on the server during page rendering
More secure as tokens never appear in client-side JavaScript
Better for SEO and initial page load performance
Handles authentication state before the client renders
Client-Side Token Retrieval
Best for: Highly interactive applications that need real-time authentication state changes.

Tokens are retrieved in the browser after the page loads
Allows for real-time authentication state management
Required when using client-side routing with authentication guards
May show loading states during token retrieval
Using TamboProvider
The TamboProvider component from @tambo-ai/react handles the token exchange process automatically:

Basic Setup

"use client";
// TamboProvider must be in a client component to manage authentication state
import { TamboProvider } from "@tambo-ai/react";
export default function Layout({ children }: { children: React.ReactNode }) {
  const userToken = useUserToken(); // Get token from your auth provider
  return <TamboProvider userToken={userToken}>{children}</TamboProvider>;
}
Why Client Component Required

TamboProvider needs to be in a client component because it manages authentication state, handles token refresh, and provides React context to child components. Server components cannot manage state or provide React context.

Provider-Specific Integration Guides
For detailed integration examples with popular authentication providers, see the following guides:

Auth.js
Learn how to integrate Tambo with Auth.js using Google OAuth as an example.

Auth0
Step-by-step guide for integrating Tambo with Auth0 authentication.

Clerk
Complete example of using Tambo with Clerk's authentication system.

Supabase
Integration guide for Supabase Auth with Tambo in Next.js applications.

Neon
How to use Tambo with Auth.js and Neon PostgreSQL database integration.

WorkOS
Enterprise-grade authentication with WorkOS and Tambo integration.

Better Auth
Modern authentication toolkit with built-in support for multiple providers and plugins.

JWT Verification Strategies
When your OAuth provider supports OpenID Connect Discovery (most do), Tambo automatically verifies tokens. For providers that don't, you can configure verification in your project dashboard:

OpenID Connect Discovery (Default): Automatic verification using the provider's public keys
Asymmetric JWT Verification: Manual verification using a provided public key
Symmetric JWT Verification: Verification using a shared secret (testing only)
None: No verification (development only)
Supabase Exception

Supabase Auth doesn't support asymmetric JWT verification. You'll need to disable JWT verification in your Tambo project settings when using Supabase.

All verification strategies can be configured in your project dashboard under Settings > User Authentication.   React SDK Hooks
Complete reference for @tambo-ai/react hooks - thread management, component state, streaming, voice, and more.

Copy Markdown
Open
The @tambo-ai/react package provides hooks that expose state values and functions to make building AI apps with Tambo simple.

Here you'll find a description of each state value and function, organized by hook.

useTambo
The primary entrypoint for the Tambo React SDK. This hook provides access to all Tambo functionality including the client, component registry, thread context, and interactable component management.


const tambo = useTambo();
This hook returns a composite of all context values from the nested providers, including:

Client context: client, queryClient, isUpdatingToken
Thread context: thread, sendThreadMessage, generationStage, isIdle, etc.
Component context: currentMessage, currentComponent
Interactable context: interactableComponents, addInteractableComponent, etc.
Context helpers: getContextHelpers, addContextHelper, removeContextHelper
Context attachments: attachments, addContextAttachment, removeContextAttachment
For most use cases, prefer using the more specific hooks (like useTamboThread or useTamboRegistry) to access only what you need.

useTamboRegistry
This hook provides helpers for component and tool registration.

registerComponent
const { registerComponent } = useTamboRegistry()

This function is used to register components with Tambo, allowing them to be potentially used in Tambo's responses.

registerTool
const { registerTool } = useTamboRegistry()

This function is used to register tools with Tambo.

registerTools
const { registerTools } = useTamboRegistry()

This function allows registering multiple tools at once.

addToolAssociation
const { addToolAssociation } = useTamboRegistry()

This function creates an association between components and tools.

componentList
const { componentList } = useTamboRegistry()

This value provides access to the list of registered components.

toolRegistry
const { toolRegistry } = useTamboRegistry()

This value provides access to the registry of all registered tools.

componentToolAssociations
const { componentToolAssociations } = useTamboRegistry()

This value provides access to the associations between components and tools.

useTamboThread
This hook provides access to the current thread and functions for managing thread interactions.

thread
const { thread } = useTamboThread()

The current thread object containing messages and metadata. Messages can be accessed via thread.messages. This value is kept up-to-date automatically by Tambo when messages are sent or received.

sendThreadMessage
const { sendThreadMessage } = useTamboThread()

Function to send a user message to Tambo and receive a response. A call to this function will update the provided thread state value.

To have the response streamed, use sendThreadMessage(message, {streamResponse: true}).

generationStage
const { generationStage } = useTamboThread()

Current stage of message generation. Possible values are:

IDLE: The thread is not currently generating any response (Initial stage)
CHOOSING_COMPONENT: Tambo is determining which component to use for the response
FETCHING_CONTEXT: Gathering necessary context for the response by calling a registered tool
HYDRATING_COMPONENT: Generating the props for a chosen component
STREAMING_RESPONSE: Actively streaming the response
COMPLETE: Generation process has finished successfully
ERROR: An error occurred during the generation process
inputValue
const { inputValue } = useTamboThread()

Current value of the thread input field.

generationStatusMessage
const { generationStatusMessage } = useTamboThread()

Status message describing the current generation state, as generated by Tambo.

isIdle
const { isIdle } = useTamboThread()

Boolean indicating whether the thread is in an idle state (generationStage is IDLE, COMPLETE, or ERROR).

switchCurrentThread
const { switchCurrentThread } = useTamboThread()

Function to change the active thread by id. This will update the thread state value to the fetched thread.

addThreadMessage
const { addThreadMessage } = useTamboThread()

Function to append a new message to the thread.

updateThreadMessage
const { updateThreadMessage } = useTamboThread()

Function to modify an existing thread message.

setLastThreadStatus
const { setLastThreadStatus } = useTamboThread()

Function to update the status of the most recent thread message.

setInputValue
const { setInputValue } = useTamboThread()

Function to update the input field value.

useTamboThreadList
This hook provides access to the list of all threads for a project and their loading states.

data
const { data } = useTamboThreadList()

Array of threads or null if not yet loaded.

isPending
const { isPending } = useTamboThreadList()

Boolean indicating if threads are currently being fetched.

isSuccess
const { isSuccess } = useTamboThreadList()

Boolean indicating if threads were successfully fetched.

isError
const { isError } = useTamboThreadList()

Boolean indicating if an error occurred while fetching threads.

error
const { error } = useTamboThreadList()

Error object containing details if the fetch failed.

useTamboThreadInput
This hook provides utilities for building an input interface that sends messages to Tambo.

value
const { value } = useTamboThreadInput()

Current value of the input field.

setValue
const { setValue } = useTamboThreadInput()

Function to update the input field value.

submit
const { submit } = useTamboThreadInput()

Function to submit the current input value, with optional context and streaming configuration.

isPending
const { isPending } = useTamboThreadInput()

Boolean indicating if a submission is in progress.

isSuccess
const { isSuccess } = useTamboThreadInput()

Boolean indicating if the last submission was successful.

isError
const { isError } = useTamboThreadInput()

Boolean indicating if the last submission failed.

error
const { error } = useTamboThreadInput()

Error object containing details if the submission failed.

useTamboSuggestions
This hook provides utilities for managing AI-generated message suggestions.

suggestions
const { suggestions } = useTamboSuggestions()

List of available AI-generated suggestions for the next message.

selectedSuggestionId
const { selectedSuggestionId } = useTamboSuggestions()

ID of the currently selected suggestion.

accept
const { accept } = useTamboSuggestions()

Function to accept and apply a suggestion, with an option for automatic submission.

acceptResult
const { acceptResult } = useTamboSuggestions()

Detailed mutation result for accepting a suggestion.

generateResult
const { generateResult } = useTamboSuggestions()

Detailed mutation result for generating new suggestions.

isPending
const { isPending } = useTamboSuggestions()

Boolean indicating if a suggestion operation is in progress.

isSuccess
const { isSuccess } = useTamboSuggestions()

Boolean indicating if the last operation was successful.

isError
const { isError } = useTamboSuggestions()

Boolean indicating if the last operation resulted in an error.

error
const { error } = useTamboSuggestions()

Error object containing details if the operation failed.

useTamboClient
This hook provides direct access to the Tambo client instance.

client
const { client } = useTamboClient()

The Tambo client instance for direct API access.

useTamboComponentState
This hook is similar to React's useState, but allows Tambo to see the state values to help respond to later messages.

const [myValue, setMyValue] = useTamboComponentState(keyName, initialValue, setFromProp)

For streaming components, use the third parameter (setFromProp) to seed editable state from AI-generated props. Combined with useTamboStreamStatus, this lets you disable inputs while streaming and hand control to the user once complete.

value and setValue
const { value } = useTamboComponentState()

Current state value stored in the thread message for the given key.

setValue
const { setValue } = useTamboComponentState()

Function to update the state value, synchronizing both local state and server state.

useTamboContextHelpers
This hook provides dynamic control over context helpers.

getContextHelpers
const { getContextHelpers } = useTamboContextHelpers()

Returns the current map of registered helper functions keyed by name.

addContextHelper
const { addContextHelper } = useTamboContextHelpers()

Adds or replaces a helper at the given key.

removeContextHelper
const { removeContextHelper } = useTamboContextHelpers()

Removes a helper by key so it is no longer included in outgoing messages.

useTamboContextAttachment
This hook provides utilities for managing context attachments that will be sent with the next user message.

attachments
const { attachments } = useTamboContextAttachment()

Array of active context attachments that will be included in additionalContext when the next message is sent.

addContextAttachment
const { addContextAttachment } = useTamboContextAttachment()

Function to add a new context attachment. Accepts an object with context (string), optional displayName (string), and optional type (string). Returns the ContextAttachment object with an auto-generated id. All attachments are automatically registered together as a single merged context helper (key: contextAttachments) that returns an array of all active attachments.


// Without displayName
const attachment = addContextAttachment({
  context: "The contents of File.txt",
});
// With displayName
const attachment = addContextAttachment({
  context: "The contents of File.txt",
  displayName: "File.txt",
});
// With displayName and type
const attachment = addContextAttachment({
  context: "The contents of File.txt",
  displayName: "File.txt",
  type: "file",
});
removeContextAttachment
const { removeContextAttachment } = useTamboContextAttachment()

Function to remove a specific context attachment by its ID. The context helper automatically updates to reflect the change.

clearContextAttachments
const { clearContextAttachments } = useTamboContextAttachment()

Function to remove all active context attachments at once. The context helper automatically updates to reflect the change. Context attachments are automatically cleared after message submission (one-time use), so you typically don't need to call this manually.

useCurrentInteractablesSnapshot
const snapshot = useCurrentInteractablesSnapshot()

Returns a cloned snapshot of the current interactable components.

useTamboCurrentMessage
const message = useTamboCurrentMessage()

Returns the complete TamboThreadMessage object for the current message, including thread ID, component data, state, and timestamps. Must be used within a component rendered as part of a message thread.

Use when you need full message/thread context. For component metadata only, see useTamboCurrentComponent.

useTamboCurrentComponent
const component = useTamboCurrentComponent()

Returns component metadata (componentName, props, interactableId, description, threadId) from the parent component context. Returns null if used outside a component. Works with both inline rendered and interactable components.

Use when you need component information or thread ID without full message context. For complete message data, see useTamboCurrentMessage.

See Interactable Components for detailed patterns and examples.

useTamboStreamStatus
Track streaming status for Tambo component props. Returns both global stream status and per-prop status flags.


const { streamStatus, propStatus } = useTamboStreamStatus<Props>();
Important: Props update repeatedly during streaming and may be partial. Use propStatus.<field>?.isSuccess before treating a prop as complete.

streamStatus
Global stream status flags for the component:


interface StreamStatus {
  isPending: boolean; // No tokens received yet, generation not active
  isStreaming: boolean; // Active streaming - generation or props still streaming
  isSuccess: boolean; // Complete - all props finished without error
  isError: boolean; // Fatal error occurred
  streamError?: Error; // First error encountered (if any)
}
propStatus
Per-prop streaming status:


interface PropStatus {
  isPending: boolean; // No tokens received for this prop yet
  isStreaming: boolean; // Prop has partial content, still updating
  isSuccess: boolean; // Prop finished streaming successfully
  error?: Error; // Error during streaming (if any)
}
Example: Wait for entire stream

const { streamStatus } = useTamboStreamStatus();
if (!streamStatus.isSuccess) {
  return <Spinner />;
}
return <Card {...props} />;
Example: Highlight in-flight props

const { propStatus } = useTamboStreamStatus<Props>();
return (
  <h2 className={propStatus.title?.isStreaming ? "animate-pulse" : ""}>
    {title}
  </h2>
);
useTamboStreamingProps
Deprecated: Use useTamboComponentState with setFromProp instead. This hook will be removed in 1.0.0.

Low-level helper that merges streamed props into state.


useTamboStreamingProps(currentState, setState, streamingProps);
useTamboGenerationStage
Access the current generation stage from the thread context.


const { generationStage } = useTamboGenerationStage();
Returns the current GenerationStage enum value. See GenerationStage for possible values.

useTamboVoice
Exposes functionality to record speech and transcribe it using the Tambo API.


const {
  startRecording,
  stopRecording,
  isRecording,
  isTranscribing,
  transcript,
  transcriptionError,
  mediaAccessError,
} = useTamboVoice();
Return values
Value	Type	Description
startRecording	() => void	Start recording audio and reset the current transcript
stopRecording	() => void	Stop recording and automatically start transcription
isRecording	boolean	Whether the user is currently recording
isTranscribing	boolean	Whether audio is being transcribed
transcript	string | null	The transcript of the recorded audio
transcriptionError	string | null	Error message if transcription fails
mediaAccessError	string | null	Error message if microphone access fails
Example

function VoiceInput() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
  } = useTamboVoice();
  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop" : "Record"}
      </button>
      {isTranscribing && <span>Transcribing...</span>}
      {transcript && <p>{transcript}</p>}
    </div>
  );
}
useTamboInteractable
Provides access to the interactable component management functions.


const {
  interactableComponents,
  addInteractableComponent,
  removeInteractableComponent,
  updateInteractableComponentProps,
  getInteractableComponent,
  getInteractableComponentsByName,
  clearAllInteractableComponents,
  setInteractableState,
  getInteractableComponentState,
  setInteractableSelected,
  clearInteractableSelections,
} = useTamboInteractable();
interactableComponents
TamboInteractableComponent[] - Array of currently registered interactable components.

addInteractableComponent
(component: Omit<TamboInteractableComponent, "id" | "createdAt">) => string

Registers a new interactable component. Returns the generated component ID.

removeInteractableComponent
(id: string) => void

Removes an interactable component by ID.

updateInteractableComponentProps
(id: string, newProps: Record<string, any>) => string

Updates the props of an interactable component. Returns a status message.

getInteractableComponent
<P, S>(id: string) => TamboInteractableComponent<P, S> | undefined

Gets a specific interactable component by ID.

getInteractableComponentsByName
(componentName: string) => TamboInteractableComponent[]

Gets all interactable components with the given name.

clearAllInteractableComponents
() => void

Removes all interactable components.

setInteractableState
(componentId: string, key: string, value: unknown) => void

Sets a specific state value for an interactable component.

getInteractableComponentState
(componentId: string) => Record<string, unknown> | undefined

Gets the current state of an interactable component.

setInteractableSelected
(componentId: string, isSelected: boolean) => void

Sets the selected state of an interactable component.

clearInteractableSelections
() => void

Clears all component selections.

useMessageImages
Hook for managing images in message input.


const { images, addImage, addImages, removeImage, clearImages } =
  useMessageImages();
images
StagedImage[] - Array of staged images ready to be sent with a message.

addImage
(file: File) => Promise<void>

Add a single image file. Throws if the file is not an image.

addImages
(files: File[]) => Promise<void>

Add multiple image files. Only valid image files will be added.

removeImage
(id: string) => void

Remove a staged image by ID.

clearImages
() => void

Remove all staged images.  # TypeScript Types
URL: /reference/react-sdk/types

The `@tambo-ai/react` package exports TypeScript types and interfaces to help you build type-safe AI applications.

## TamboTool

The `TamboTool` interface defines the structure for registering tools with Tambo.

```typescript
interface TamboTool {
  name: string;
  description: string;
  tool: (params: Record<string, unknown>) => unknown;
  inputSchema: z.ZodObject | JSONSchema7;
  outputSchema: z.ZodTypeAny | JSONSchema7;
  transformToContent?: (
    result: any,
  ) => Promise<ChatCompletionContentPart[]> | ChatCompletionContentPart[];
  maxCalls?: number;
}
```

### Properties

#### name

The unique identifier for the tool. This is how Tambo references the tool internally.

```typescript
name: string;
```

#### description

A clear description of what the tool does. This helps the AI understand when to use the tool.

```typescript
description: string;
```

#### tool

The function that implements the tool's logic. Receives a single object with named parameters.

```typescript
tool: (params: Record<string, unknown>) => unknown;
```

#### inputSchema

A Zod schema that defines the tool's input parameters. Can also be a JSON Schema object. Use `z.object({})` (or an equivalent empty object schema) for no-parameter tools.

```typescript
inputSchema: z.ZodObject | JSONSchema7;
```

**Example:**

```typescript
inputSchema: z.object({
  city: z.string().describe("The city name"),
  units: z.enum(["celsius", "fahrenheit"]).optional(),
});
```

#### outputSchema

A Zod schema that defines the tool's return type. Can also be a JSON Schema object.

```typescript
outputSchema: z.ZodTypeAny | JSONSchema7;
```

**Example:**

```typescript
outputSchema: z.object({
  temperature: z.number(),
  condition: z.string(),
});
```

#### transformToContent (optional)

A function that transforms the tool's return value into an array of content parts. Use this when your tool needs to return rich content like images or audio.

```typescript
transformToContent?: (result: any) => Promise<ChatCompletionContentPart[]> | ChatCompletionContentPart[];
```

By default, tool responses are stringified and wrapped in a text content part. The `transformToContent` function allows you to return rich content including images, audio, or mixed media.

**Example:**

```typescript
transformToContent: (result) => [
  { type: "text", text: result.description },
  { type: "image_url", image_url: { url: result.imageUrl } },
];
```

[Learn more about returning rich content from tools](/guides/take-actions/register-tools#return-rich-content-optional).

## TamboComponent

The `TamboComponent` interface defines the structure for registering React components with Tambo.

```typescript
interface TamboComponent {
  name: string;
  description: string;
  component: ComponentType<any>;
  propsSchema?: z.ZodTypeAny | JSONSchema7;
  propsDefinition?: any;
  loadingComponent?: ComponentType<any>;
  associatedTools?: TamboTool[];
}
```

### Properties

#### name

The unique identifier for the component.

```typescript
name: string;
```

#### description

A clear description of what the component displays or does. This helps the AI understand when to use the component.

```typescript
description: string;
```

#### component

The React component to render.

```typescript
component: ComponentType<any>;
```

#### propsSchema (recommended)

A Zod schema that defines the component's props.

```typescript
propsSchema?: z.ZodTypeAny | JSONSchema7;
```

#### propsDefinition (deprecated)

A JSON object defining the component's props. Use `propsSchema` instead.

```typescript
propsDefinition?: any;
```

#### loadingComponent (optional)

A component to display while the main component is loading.

```typescript
loadingComponent?: ComponentType<any>;
```

#### associatedTools (optional)

An array of tools that are associated with this component.

```typescript
associatedTools?: TamboTool[];
```

## ChatCompletionContentPart

Content parts that can be sent to or received from the AI.

```typescript
interface ChatCompletionContentPart {
  type: "text" | "image_url" | "input_audio";
  text?: string;
  image_url?: { url: string; detail?: "auto" | "high" | "low" };
  input_audio?: { data: string; format: "wav" | "mp3" };
}
```

This type is used in the `transformToContent` function to define rich content responses.

## TamboThreadMessage

A message in a Tambo thread.

```typescript
interface TamboThreadMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: ChatCompletionContentPart[];
  createdAt: string;
  renderedComponent?: React.ReactNode;
  component?: {
    componentName: string;
    props: any;
  };
  actionType?: string;
  error?: string;
}
```

## TamboThread

A Tambo conversation thread.

```typescript
interface TamboThread {
  id: string;
  messages: TamboThreadMessage[];
  contextKey?: string;
  createdAt: string;
  updatedAt: string;
}
```

## GenerationStage

The current stage of AI response generation.

```typescript
enum GenerationStage {
  IDLE = "IDLE",
  CHOOSING_COMPONENT = "CHOOSING_COMPONENT",
  FETCHING_CONTEXT = "FETCHING_CONTEXT",
  HYDRATING_COMPONENT = "HYDRATING_COMPONENT",
  STREAMING_RESPONSE = "STREAMING_RESPONSE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}
```

## ContextAttachment

Represents a context attachment that will be sent with the next user message.

```typescript
interface ContextAttachment {
  id: string; // Auto-generated unique identifier
  displayName?: string; // Optional display name for UI rendering
  context: string; // The context value that will be used in additionalContext
  type?: string; // Optional type identifier for grouping/rendering
}
```

### Properties

#### id

Unique identifier for the attachment. Auto-generated when adding a context attachment.

```typescript
id: string;
```

#### displayName

Display name for UI rendering.

```typescript
displayName: string;
```

#### context

The context value that will be used in `additionalContext` when the next message is sent.

```typescript
context: string;
```

#### type

Optional type identifier for grouping/rendering multiple contexts of the same type.

```typescript
type?: string;
```

## ContextAttachmentState

The state interface returned by the `useTamboContextAttachment` hook.

```typescript
interface ContextAttachmentState {
  attachments: ContextAttachment[];
  addContextAttachment: (
    contextAttachment: Omit<ContextAttachment, "id">,
  ) => ContextAttachment;
  removeContextAttachment: (id: string) => void;
  clearContextAttachments: () => void;
}
```

### Properties

#### attachments

Array of active context attachments that will be included in `additionalContext` when the next message is sent.

```typescript
attachments: ContextAttachment[];
```

#### addContextAttachment

Function to add a new context attachment. The `id` is automatically generated. All attachments are automatically registered together as a single merged context helper (key: `contextAttachments`) that returns an array of all active attachments.

```typescript
addContextAttachment: (contextAttachment: Omit<ContextAttachment, "id">) =>
  ContextAttachment;
```

#### removeContextAttachment

Function to remove a specific context attachment by its ID. The context helper automatically updates to reflect the change.

```typescript
removeContextAttachment: (id: string) => void;
```

#### clearContextAttachments

Function to remove all active context attachments. The context helper automatically updates to reflect the change. Context attachments are automatically cleared after message submission (one-time use), so you typically don't need to call this manually.

```typescript
clearContextAttachments: () => void;
```

## StreamStatus

Global stream status flags for a component during streaming. Returned by `useTamboStreamStatus`.

```typescript
interface StreamStatus {
  isPending: boolean; // No tokens received yet, generation not active
  isStreaming: boolean; // Active streaming - generation or props still streaming
  isSuccess: boolean; // Complete - all props finished without error
  isError: boolean; // Fatal error occurred
  streamError?: Error; // First error encountered (if any)
}
```

## PropStatus

Streaming status flags for individual component props. Returned by `useTamboStreamStatus`.

```typescript
interface PropStatus {
  isPending: boolean; // No tokens received for this prop yet
  isStreaming: boolean; // Prop has partial content, still updating
  isSuccess: boolean; // Prop finished streaming successfully
  error?: Error; // Error during streaming (if any)
}
```

## TamboInteractableComponent

Represents a component instance that can be interacted with by Tambo. Extends `TamboComponent`.

```typescript
interface TamboInteractableComponent<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> extends TamboComponent {
  id: string; // Unique identifier for this instance
  props: Props; // Current props
  isSelected?: boolean; // Whether selected for interaction
  state?: State; // Current component state
  stateSchema?: SupportedSchema<State>; // Optional state validation schema
}
```

## InteractableConfig

Configuration for the `withInteractable` HOC.

```typescript
interface InteractableConfig<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> {
  componentName: string; // Name used for identification
  description: string; // Description for LLM understanding
  propsSchema?: SupportedSchema<Props>; // Optional props validation
  stateSchema?: SupportedSchema<State>; // Optional state validation
}
```

## WithTamboInteractableProps

Props injected by `withInteractable` HOC.

```typescript
interface WithTamboInteractableProps {
  interactableId?: string; // Optional custom ID
  onInteractableReady?: (id: string) => void; // Called when registered
  onPropsUpdate?: (newProps: Record<string, unknown>) => void; // Called on prop updates
}
```

## InteractableMetadata

Metadata about an interactable component.

```typescript
interface InteractableMetadata {
  id: string;
  componentName: string;
  description: string;
}
```

## ToolAnnotations

Annotations describing a tool's behavior, aligned with the MCP specification.

```typescript
type ToolAnnotations = MCPToolAnnotations & {
  tamboStreamableHint?: boolean; // Safe to call repeatedly during streaming
};
```

The `tamboStreamableHint` property indicates that the tool is safe to be called repeatedly while a response is being streamed. This is typically used for read-only tools that do not cause side effects.

## SupportedSchema

A schema type that accepts either a Standard Schema compliant validator or a raw JSON Schema object.

```typescript
type SupportedSchema<Shape = unknown> =
  | StandardSchemaV1<Shape, Shape>
  | JSONSchema7;
```

Standard Schema is a specification that provides a unified interface for TypeScript validation libraries. Libraries like Zod, Valibot, and ArkType implement this spec.

## StagedImage

Represents an image staged for upload in message input.

```typescript
interface StagedImage {
  id: string; // Unique identifier
  name: string; // File name
  dataUrl: string; // Base64 data URL
  file: File; // Original File object
  size: number; // File size in bytes
  type: string; // MIME type
}
```

## AdditionalContext

Interface for additional context that can be added to messages.

```typescript
interface AdditionalContext {
  name: string; // Name of the context type
  context: unknown; // The context data
}
```

## ContextHelperFn

A function that returns context data to include in messages.

```typescript
type ContextHelperFn = () =>
  | unknown
  | null
  | undefined
  | Promise<unknown | null | undefined>;
```

Return `null` or `undefined` to skip including the context.

## ContextHelpers

A collection of context helpers keyed by their context name.

```typescript
type ContextHelpers = Record<string, ContextHelperFn>;
```

The key becomes the `AdditionalContext.name` sent to the model.
 # Utility Functions
URL: /reference/react-sdk/utilities

The `@tambo-ai/react` package exports utility functions for common tasks like defining tools with full type inference and making components interactable.

## defineTool

Type-safe helper for defining Tambo tools. Provides full type inference from your schema definitions.

```tsx
import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

const weatherTool = defineTool({
  name: "get_weather",
  description: "Get current weather for a location",
  tool: async ({ location }) => {
    const response = await fetch(`/api/weather?location=${location}`);
    return response.json();
  },
  inputSchema: z.object({
    location: z.string().describe("City name or zip code"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
  }),
});
```

### Parameters

The `defineTool` function accepts a tool definition object:

| Property             | Type              | Required | Description                                    |
| -------------------- | ----------------- | -------- | ---------------------------------------------- |
| `name`               | `string`          | Yes      | Unique identifier for the tool                 |
| `description`        | `string`          | Yes      | Description of what the tool does (used by AI) |
| `tool`               | `function`        | Yes      | The function implementing the tool logic       |
| `inputSchema`        | `SupportedSchema` | Yes      | Schema for input parameters                    |
| `outputSchema`       | `SupportedSchema` | Yes      | Schema for return value                        |
| `title`              | `string`          | No       | Human-readable display name                    |
| `maxCalls`           | `number`          | No       | Maximum calls per response                     |
| `annotations`        | `ToolAnnotations` | No       | Behavior hints (e.g., `tamboStreamableHint`)   |
| `transformToContent` | `function`        | No       | Transform result to content parts              |

### Schema Support

Tambo uses the [Standard Schema](https://standard-schema.dev) specification, so you can use any compliant validator:

```tsx
// Zod
import { z } from "zod";
inputSchema: z.object({ query: z.string() });

// Valibot
import * as v from "valibot";
inputSchema: v.object({ query: v.string() });

// ArkType
import { type } from "arktype";
inputSchema: type({ query: "string" });
```

### Streaming-Safe Tools

For tools that are safe to call repeatedly during streaming (typically read-only tools), use the `tamboStreamableHint` annotation:

```tsx
const searchTool = defineTool({
  name: "search",
  description: "Search for items",
  annotations: {
    tamboStreamableHint: true, // Safe for streaming
  },
  tool: async ({ query }) => searchDatabase(query),
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.array(z.object({ id: z.string(), title: z.string() })),
});
```

## withInteractable

Higher-Order Component that makes any component interactable by Tambo. Interactable components can have their props and state modified by the AI during a conversation.

```tsx
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";

const Note = ({ title, content }: { title: string; content: string }) => (
  <div className="note">
    <h2>{title}</h2>
    <p>{content}</p>
  </div>
);

const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A note component that can be edited by the AI",
  propsSchema: z.object({
    title: z.string(),
    content: z.string(),
  }),
});

// Usage
<InteractableNote title="My Note" content="Initial content" />;
```

### Parameters

```tsx
withInteractable(WrappedComponent, config);
```

| Parameter          | Type                  | Description                        |
| ------------------ | --------------------- | ---------------------------------- |
| `WrappedComponent` | `React.ComponentType` | The component to make interactable |
| `config`           | `InteractableConfig`  | Configuration for the interactable |

### InteractableConfig

| Property        | Type              | Required | Description                         |
| --------------- | ----------------- | -------- | ----------------------------------- |
| `componentName` | `string`          | Yes      | Unique name for identification      |
| `description`   | `string`          | Yes      | Description for AI understanding    |
| `propsSchema`   | `SupportedSchema` | No       | Schema for validating prop updates  |
| `stateSchema`   | `SupportedSchema` | No       | Schema for validating state updates |

### Injected Props

The wrapped component receives additional props:

| Prop                  | Type                                          | Description                          |
| --------------------- | --------------------------------------------- | ------------------------------------ |
| `interactableId`      | `string`                                      | Optional custom ID for this instance |
| `onInteractableReady` | `(id: string) => void`                        | Called when component is registered  |
| `onPropsUpdate`       | `(newProps: Record<string, unknown>) => void` | Called when AI updates props         |

### Example with State

```tsx
import { withInteractable, useTamboComponentState } from "@tambo-ai/react";
import { z } from "zod";

const Task = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const [isComplete, setIsComplete] = useTamboComponentState(
    "isComplete",
    false,
  );

  return (
    <div className={isComplete ? "completed" : ""}>
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={() => setIsComplete(!isComplete)}>
        {isComplete ? "Undo" : "Complete"}
      </button>
    </div>
  );
};

const InteractableTask = withInteractable(Task, {
  componentName: "Task",
  description: "A task that can be completed or edited",
  propsSchema: z.object({
    title: z.string(),
    description: z.string(),
  }),
  stateSchema: z.object({
    isComplete: z.boolean(),
  }),
});
```

## Built-in Context Helpers

Tambo provides pre-built context helpers that automatically provide useful information to the AI.

### currentPageContextHelper

Provides information about the user's current page.

```tsx
import { currentPageContextHelper } from "@tambo-ai/react";

// Returns: { url: "https://...", title: "Page Title" }
```

### currentTimeContextHelper

Provides the current timestamp.

```tsx
import { currentTimeContextHelper } from "@tambo-ai/react";

// Returns: { timestamp: "Wed Jan 22 2025 10:30:00 GMT-0800" }
```

### Using Context Helpers

Context helpers are configured on the `TamboProvider`:

```tsx
import {
  TamboProvider,
  currentPageContextHelper,
  currentTimeContextHelper,
} from "@tambo-ai/react";

<TamboProvider
  apiKey={process.env.TAMBO_API_KEY}
  contextHelpers={{
    currentPage: currentPageContextHelper,
    currentTime: currentTimeContextHelper,
    // Custom helper
    userPreferences: () => ({
      theme: "dark",
      language: "en",
    }),
  }}
>
  <App />
</TamboProvider>;
```

### Dynamic Context Helpers

You can add/remove context helpers dynamically using `useTamboContextHelpers`:

```tsx
import { useTamboContextHelpers } from "@tambo-ai/react";

function MyComponent() {
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  useEffect(() => {
    addContextHelper("selection", () => ({
      selectedItems: getSelectedItems(),
    }));

    return () => removeContextHelper("selection");
  }, []);
}
```

Context helper return values:

* Return a value to include it in the context
* Return `null` or `undefined` to skip
* Can be async (return a Promise)
 # Provider Components
URL: /reference/react-sdk/providers

Provider components configure Tambo functionality and make hooks available throughout your component tree.

## TamboProvider

The main provider that wraps your application and provides access to the full Tambo API. This is the primary way to integrate Tambo into your React app.

```tsx
import { TamboProvider } from "@tambo-ai/react";

function App() {
  return (
    <TamboProvider
      apiKey={process.env.TAMBO_API_KEY}
      components={myComponents}
      tools={myTools}
    >
      <YourApp />
    </TamboProvider>
  );
}
```

### Props

| Prop                        | Type                          | Required | Description                                      |
| --------------------------- | ----------------------------- | -------- | ------------------------------------------------ |
| `apiKey`                    | `string`                      | Yes\*    | Your Tambo API key                               |
| `userToken`                 | `string`                      | No       | OAuth token for user authentication              |
| `tamboUrl`                  | `string`                      | No       | Custom Tambo API URL                             |
| `environment`               | `string`                      | No       | Environment name                                 |
| `components`                | `TamboComponent[]`            | No       | Components to register                           |
| `tools`                     | `TamboTool[]`                 | No       | Tools to register                                |
| `mcpServers`                | `McpServerInfo[]`             | No       | MCP servers to connect                           |
| `contextHelpers`            | `ContextHelpers`              | No       | Context helper functions                         |
| `contextKey`                | `string`                      | No       | Key for thread scoping                           |
| `streaming`                 | `boolean`                     | No       | Enable streaming (default: `true`)               |
| `autoGenerateThreadName`    | `boolean`                     | No       | Auto-generate thread names (default: `true`)     |
| `autoGenerateNameThreshold` | `number`                      | No       | Message count for name generation (default: `3`) |
| `initialMessages`           | `InitialTamboThreadMessage[]` | No       | Initial messages for new threads                 |
| `onCallUnregisteredTool`    | `function`                    | No       | Callback for unregistered tool calls             |
| `resources`                 | `ListResourceItem[]`          | No       | Static resources for MCP                         |
| `listResources`             | `function`                    | No       | Dynamic resource listing                         |
| `getResource`               | `function`                    | No       | Resource content resolver                        |

\*Either `apiKey` or `userToken` is required for authentication.

### Example with All Options

```tsx
import {
  TamboProvider,
  currentPageContextHelper,
  type TamboComponent,
  type TamboTool,
} from "@tambo-ai/react";

const components: TamboComponent[] = [
  {
    name: "WeatherCard",
    description: "Displays weather information",
    component: WeatherCard,
    propsSchema: z.object({
      city: z.string(),
      temperature: z.number(),
    }),
  },
];

const tools: TamboTool[] = [
  {
    name: "get_weather",
    description: "Fetch weather for a city",
    tool: async ({ city }) => fetchWeather(city),
    inputSchema: z.object({ city: z.string() }),
    outputSchema: z.object({ temperature: z.number() }),
  },
];

<TamboProvider
  apiKey={process.env.TAMBO_API_KEY}
  components={components}
  tools={tools}
  contextHelpers={{
    currentPage: currentPageContextHelper,
  }}
  streaming={true}
  autoGenerateThreadName={true}
  autoGenerateNameThreshold={3}
>
  <App />
</TamboProvider>;
```

### Provider Hierarchy

`TamboProvider` internally nests several sub-providers in this order:

1. `TamboClientProvider` - API client and authentication
2. `TamboRegistryProvider` - Component and tool registration
3. `TamboContextHelpersProvider` - Context helper management
4. `TamboThreadProvider` - Thread state and messaging
5. `TamboMcpTokenProvider` - MCP token management
6. `TamboMcpProvider` - MCP server connections
7. `TamboContextAttachmentProvider` - Context attachments
8. `TamboComponentProvider` - Component lifecycle
9. `TamboInteractableProvider` - Interactable components
10. `TamboThreadInputProvider` - Input handling

For advanced use cases, you can use individual providers directly instead of `TamboProvider`.

## TamboStubProvider

A stub provider for testing and development that doesn't require API connectivity.

```tsx
import { TamboStubProvider } from "@tambo-ai/react";

function TestApp() {
  return (
    <TamboStubProvider
      stubResponses={[
        {
          component: {
            componentName: "WeatherCard",
            props: { city: "Seattle", temperature: 65 },
          },
        },
      ]}
    >
      <YourComponent />
    </TamboStubProvider>
  );
}
```

### Props

| Prop             | Type                   | Description              |
| ---------------- | ---------------------- | ------------------------ |
| `stubResponses`  | `TamboThreadMessage[]` | Pre-configured responses |
| `components`     | `TamboComponent[]`     | Components to register   |
| `tools`          | `TamboTool[]`          | Tools to register        |
| `contextHelpers` | `ContextHelpers`       | Context helpers          |

## TamboMcpProvider

Provider for Model Context Protocol (MCP) server connections. Required when using MCP features.

```tsx
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

// Inside TamboProvider
<TamboMcpProvider
  handlers={{
    elicitation: async (request, extra, serverInfo) => {
      // Handle elicitation requests
      return { action: "accept", content: {} };
    },
  }}
  contextKey="my-context"
>
  <App />
</TamboMcpProvider>;
```

### Props

| Prop         | Type                  | Description                           |
| ------------ | --------------------- | ------------------------------------- |
| `handlers`   | `ProviderMCPHandlers` | Optional handlers for all MCP servers |
| `contextKey` | `string`              | Context key for threadless MCP tokens |
| `children`   | `ReactNode`           | Child components                      |

**Note**: MCP servers are configured on `TamboProvider` via the `mcpServers` prop. `TamboMcpProvider` manages the connections and provides hooks to interact with them.

### MCP Server Configuration

Configure MCP servers on `TamboProvider`:

```tsx
<TamboProvider
  apiKey={process.env.TAMBO_API_KEY}
  mcpServers={[
    {
      name: "linear",
      url: "https://linear-mcp.example.com",
      transport: "http",
      serverKey: "linear",
    },
    {
      name: "github",
      url: "https://github-mcp.example.com",
      transport: "http",
      serverKey: "github",
      customHeaders: {
        Authorization: `Bearer ${githubToken}`,
      },
    },
  ]}
>
  <TamboMcpProvider>
    <App />
  </TamboMcpProvider>
</TamboProvider>
```

See the [MCP reference](/reference/react-sdk/mcp) for hooks and types related to MCP functionality.

## Individual Providers

For advanced use cases, you can use individual providers directly:

### TamboClientProvider

Provides the API client and authentication context.

```tsx
import { TamboClientProvider, useTamboClient } from "@tambo-ai/react";

<TamboClientProvider
  apiKey={process.env.TAMBO_API_KEY}
  tamboUrl="https://api.tambo.co"
>
  <App />
</TamboClientProvider>;
```

### TamboRegistryProvider

Manages component and tool registration.

```tsx
import { TamboRegistryProvider, useTamboRegistry } from "@tambo-ai/react";

<TamboRegistryProvider
  components={components}
  tools={tools}
  mcpServers={mcpServers}
>
  <App />
</TamboRegistryProvider>;
```

### TamboThreadProvider

Manages thread state and message sending.

```tsx
import { TamboThreadProvider, useTamboThread } from "@tambo-ai/react";

<TamboThreadProvider
  contextKey="chat"
  streaming={true}
  autoGenerateThreadName={true}
>
  <App />
</TamboThreadProvider>;
```

### TamboContextHelpersProvider

Manages context helpers that provide additional information to the AI.

```tsx
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "@tambo-ai/react";

<TamboContextHelpersProvider
  contextHelpers={{
    currentPage: () => ({ url: window.location.href }),
  }}
>
  <App />
</TamboContextHelpersProvider>;
```

### TamboInteractableProvider

Manages interactable component registration and state.

```tsx
import {
  TamboInteractableProvider,
  useTamboInteractable,
} from "@tambo-ai/react";

<TamboInteractableProvider>
  <App />
</TamboInteractableProvider>;
```
