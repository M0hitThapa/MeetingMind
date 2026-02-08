'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { 
  CheckCircle2, 
  Loader2, 
  Upload, 
  Mic, 
  Brain,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeetingStatus } from '@/types';

interface ProcessingStatusProps {
  status: MeetingStatus;
  progress: number;
  error?: string;
}

const steps = [
  { id: 'uploading', label: 'Uploading', icon: Upload },
  { id: 'transcribing', label: 'Transcribing', icon: Mic },
  { id: 'analyzing', label: 'AI Analysis', icon: Brain },
  { id: 'completed', label: 'Complete', icon: CheckCircle2 },
];

export function ProcessingStatus({ status, progress, error }: ProcessingStatusProps) {
  const currentStepIndex = steps.findIndex(s => s.id === status);
  const isError = status === 'error';

  return (
    <Card className={cn(isError && "border-red-500/20")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}
          {isError ? 'Processing Failed' : 'Processing Meeting'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {progress}% complete
          </p>
        </div>

        
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-green-500 text-white",
                  isPending && "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs text-center",
                  isActive && "font-medium text-primary",
                  isCompleted && "text-green-500",
                  isPending && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        
        {isError && error && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        
        {!isError && status !== 'completed' && (
          <p className="text-xs text-center text-muted-foreground">
            Estimated time remaining: {Math.max(1, Math.ceil((100 - progress) / 20))} minutes
          </p>
        )}
      </CardContent>
    </Card>
  );
}