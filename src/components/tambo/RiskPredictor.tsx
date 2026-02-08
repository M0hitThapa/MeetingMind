'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  User,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TamboComponentProps, RiskPredictorData } from './types';

export function RiskPredictor({ data, className }: TamboComponentProps<RiskPredictorData>) {
  const { risks = [], overallRiskLevel, riskTrend } = data;

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRiskScore = (probability: number, impact: number) => {
    return probability * impact;
  };

  const sortedRisks = [...risks].sort((a, b) => 
    getRiskScore(b.probability, b.impact) - getRiskScore(a.probability, a.impact)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Risk Assessment
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              overallRiskLevel === 'critical' ? 'bg-red-500' :
              overallRiskLevel === 'high' ? 'bg-orange-500' :
              overallRiskLevel === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            )}>
              {overallRiskLevel?.toUpperCase()}
            </Badge>
            {riskTrend && (
              <Badge variant="outline" className="flex items-center gap-1">
                {riskTrend === 'improving' ? <TrendingDown className="w-3 h-3 text-green-500" /> :
                 riskTrend === 'worsening' ? <TrendingUp className="w-3 h-3 text-red-500" /> :
                 <CheckCircle2 className="w-3 h-3 text-gray-500" />}
                {riskTrend}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRisks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="font-medium text-green-600">No risks identified</p>
            <p className="text-sm text-muted-foreground">All systems look good</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sortedRisks.map(risk => {
                const riskScore = getRiskScore(risk.probability, risk.impact);
                
                return (
                  <div 
                    key={risk.id} 
                    className={cn(
                      "p-4 rounded-lg border",
                      getRiskColor(risk.severity)
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="font-semibold text-sm">{risk.description}</h4>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <Badge variant="outline" className="bg-white/50">
                            {risk.category}
                          </Badge>
                          {risk.owner && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {risk.owner}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Detected {new Date(risk.detectedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {risk.mitigation && (
                          <div className="mt-3 p-2 bg-white/50 rounded text-sm">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(riskScore * 100)}%
                        </div>
                        <div className="text-xs opacity-75">Risk Score</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Probability: {Math.round(risk.probability * 100)}%</span>
                        <span>Impact: {Math.round(risk.impact * 100)}%</span>
                      </div>
                      <Progress 
                        value={riskScore * 100} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-4 gap-4 text-center">
                {['critical', 'high', 'medium', 'low'].map(level => {
                  const count = risks.filter(r => r.severity === level).length;
                  return (
                    <div key={level}>
                      <div className={cn(
                        "text-2xl font-bold",
                        level === 'critical' ? 'text-red-500' :
                        level === 'high' ? 'text-orange-500' :
                        level === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      )}>
                        {count}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{level}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}