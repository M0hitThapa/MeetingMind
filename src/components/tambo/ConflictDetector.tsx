'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, AlertCircle, XCircle, Users, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, ConflictDetectorData } from './types';

export function ConflictDetector({ data, className }: TamboComponentProps<ConflictDetectorData>) {
  const { conflicts = [], totalRisks = 0, resolvedCount = 0 } = data;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'mitigated': return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      default: return <XCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const openConflicts = conflicts.filter(c => c.status === 'open');
  const resolvedConflicts = conflicts.filter(c => c.status !== 'open');

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Conflict Detector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-medium text-green-600">No conflicts detected</p>
            <p className="text-sm text-muted-foreground mt-1">
              The meeting proceeded smoothly without significant disagreements
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Conflicts & Risks
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {openConflicts.length} open
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-700">
              {resolvedConflicts.length} resolved
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {openConflicts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Active Issues ({openConflicts.length})
            </h4>
            <div className="space-y-2">
              {openConflicts.map(conflict => (
                <div 
                  key={conflict.id} 
                  className="p-3 border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getSeverityColor(conflict.severity)}>
                          {getSeverityIcon(conflict.severity)}
                          <span className="ml-1 capitalize">{conflict.severity}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {conflict.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{conflict.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {conflict.participants.join(', ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(conflict.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resolvedConflicts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Resolved ({resolvedConflicts.length})
            </h4>
            <div className="space-y-2">
              {resolvedConflicts.map(conflict => (
                <div 
                  key={conflict.id} 
                  className="p-3 border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 rounded-lg opacity-75"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(conflict.status)}
                    <span className="text-xs font-medium capitalize">{conflict.status}</span>
                  </div>
                  <p className="text-sm line-through text-muted-foreground">{conflict.description}</p>
                  {conflict.resolution && (
                    <p className="text-xs text-green-600 mt-1">
                      Resolution: {conflict.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-500">{totalRisks}</p>
              <p className="text-xs text-muted-foreground">Total Risks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{resolvedCount}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                {Math.round((resolvedCount / Math.max(totalRisks, 1)) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Resolution Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}