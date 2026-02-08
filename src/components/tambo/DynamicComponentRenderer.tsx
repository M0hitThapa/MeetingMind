'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ComponentConfig } from './types';


import { MeetingSummary } from './MeetingSummary';
import { DecisionTracker } from './DecisionTracker';
import { ActionItemList } from './ActionItemList';
import { TopicExplorer } from './TopicExplorer';
import { SpeakerAnalytics } from './SpeakerAnalytics';
import { TimelineView } from './TimeLineView';
import { KanbanBoard } from './KanbanBoard';
import { PriorityMatrix } from './PriorityMatrix';
import { SentimentTimeline } from './SentimentTimeline';
import { PersonView } from './PersonView';
import { ConflictDetector } from './ConflictDetector';
import { MeetingComparator } from './MeetingComparator';
import { TodoDashboard } from './TodoDashboard';
import { RiskPredictor } from './RiskPredictor';
import { FlashcardGenerator } from './FlashCardGenerator';

const componentMap = {
  meeting_summary: MeetingSummary,
  decision_tracker: DecisionTracker,
  action_item_list: ActionItemList,
  topic_explorer: TopicExplorer,
  speaker_analytics: SpeakerAnalytics,
  timeline_view: TimelineView,
  kanban_board: KanbanBoard,
  priority_matrix: PriorityMatrix,
  sentiment_timeline: SentimentTimeline,
  person_view: PersonView,
  conflict_detector: ConflictDetector,
  meeting_comparator: MeetingComparator,
  todo_dashboard: TodoDashboard,
  risk_predictor: RiskPredictor,
  flashcard_generator: FlashcardGenerator,
};

interface DynamicComponentRendererProps {
  config: ComponentConfig;
}

export function DynamicComponentRenderer({ config }: DynamicComponentRendererProps) {
  const Component = componentMap[config.type as keyof typeof componentMap];
  
  console.log('[DynamicComponentRenderer] Rendering:', { 
    type: config.type, 
    hasComponent: !!Component,
    data: config.data 
  });

  if (!Component) {
    return (
      <Card className="p-6 border-dashed border-red-500/20">
        <p className="text-red-500 text-sm">Unknown component: {config.type}</p>
      </Card>
    );
  }

  const getLayoutClasses = () => {
    switch (config.layout) {
      case 'half': return 'col-span-1 md:col-span-2 lg:col-span-2';
      case 'third': return 'col-span-1';
      case 'card': return 'col-span-1';
      default: return 'col-span-1 md:col-span-2 lg:col-span-3';
    }
  };

  return (
    <div className={getLayoutClasses()}>
      <Suspense fallback={
        <Card className="w-full h-64">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </CardContent>
        </Card>
      }>
        <Component
          data={config.data as any}
          className="h-full"
        />
      </Suspense>
    </div>
  );
}
