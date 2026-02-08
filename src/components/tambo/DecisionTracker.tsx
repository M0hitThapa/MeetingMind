'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import type { TamboComponentProps, DecisionTrackerData } from './types';

export function DecisionTracker({ data, className }: TamboComponentProps<DecisionTrackerData>) {
  const { decisions = [] } = data;

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (confidence >= 0.5) return <HelpCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (confidence >= 0.5) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  if (decisions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--muted-foreground)] text-center py-8">No decisions recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Decisions ({decisions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {decisions.map((decision) => (
          <div 
            key={decision.id} 
            className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium flex-1">{decision.text}</p>
              <Badge variant="outline" className={getConfidenceColor(decision.confidence)}>
                {getConfidenceIcon(decision.confidence)}
                <span className="ml-1">{Math.round(decision.confidence * 100)}%</span>
              </Badge>
            </div>
            {decision.owner && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Owner: <span className="font-medium">{decision.owner}</span>
              </p>
            )}
            {decision.context && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1 italic">
                &ldquo;{decision.context}&rdquo;
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}