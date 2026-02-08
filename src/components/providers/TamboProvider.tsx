'use client';

import { TamboProvider as Provider } from '@tambo-ai/react';
import { ReactNode } from 'react';
import { components, tools } from '@/components/tambo';

interface TamboProviderProps {
  children: ReactNode;
}

export function TamboProvider({ children }: TamboProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const environment = process.env.NEXT_PUBLIC_TAMBO_ENVIRONMENT as "production" | "staging" | undefined;

  
  if (!apiKey || apiKey === 'your-tambo-api-key' || apiKey === '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Tambo API Key Missing</h2>
          <p className="text-muted-foreground">
            Please add your Tambo API key to the <code className="bg-muted px-1 py-0.5 rounded">.env</code> file:
          </p>
          <pre className="bg-muted p-3 rounded text-left text-sm overflow-x-auto">
            NEXT_PUBLIC_TAMBO_API_KEY="your-actual-api-key"
            NEXT_PUBLIC_TAMBO_ENVIRONMENT="production"
          </pre>
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://tambo.ai/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">tambo.ai/dashboard</a>
          </p>
          <p className="text-xs text-muted-foreground">
            After adding the key, restart the dev server with <code className="bg-muted px-1 py-0.5 rounded">pnpm dev</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <Provider
      apiKey={apiKey}
      environment={environment}
      components={components}
      tools={tools}
    >
      {children}
    </Provider>
  );
}
