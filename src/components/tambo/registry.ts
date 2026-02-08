'use client';

import type { TamboComponent } from '@tambo-ai/react';
import { z } from 'zod';


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


const MeetingSummaryPropsSchema = z.object({
  summary: z.string().describe("Executive summary of the meeting"),
  keyPoints: z.array(z.string()).optional(),
  duration: z.number().optional(),
  participantCount: z.number().optional(),
});

const DecisionTrackerPropsSchema = z.object({
  decisions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    owner: z.string().optional(),
    timestamp: z.string().optional(),
    confidence: z.number().optional(),
  })),
});

const ActionItemListPropsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    completed: z.boolean().optional(),
  })),
});

const TopicExplorerPropsSchema = z.object({
  topics: z.array(z.object({
    name: z.string(),
    relevance: z.number(),
    mentions: z.number().optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  })),
});

const SpeakerAnalyticsPropsSchema = z.object({
  speakers: z.array(z.object({
    name: z.string(),
    speakingTime: z.number(),
    percentage: z.number(),
    segments: z.number().optional(),
  })),
  totalDuration: z.number().optional(),
});

const TimelineViewPropsSchema = z.object({
  chapters: z.array(z.object({
    id: z.string(),
    start: z.number(),
    end: z.number(),
    headline: z.string(),
    summary: z.string().optional(),
  })).optional(),
  keyMoments: z.array(z.object({
    type: z.enum(['decision', 'action_item', 'insight', 'concern', 'agreement', 'disagreement']),
    timestamp: z.number(),
    description: z.string(),
    importance: z.number().optional(),
  })).optional(),
  duration: z.number().optional(),
});

const KanbanBoardPropsSchema = z.object({
  columns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    items: z.array(z.object({
      id: z.string(),
      text: z.string(),
      assignee: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      tags: z.array(z.string()).optional(),
    })),
  })),
});

const SentimentTimelinePropsSchema = z.object({
  timeline: z.array(z.object({
    timestamp: z.number(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    score: z.number(),
    text: z.string().optional(),
  })),
  overall: z.enum(['positive', 'neutral', 'negative']).optional(),
  averageScore: z.number().optional(),
});

const PriorityMatrixPropsSchema = z.object({
  quadrants: z.object({
    q1: z.array(z.object({ id: z.string(), text: z.string() })),
    q2: z.array(z.object({ id: z.string(), text: z.string() })),
    q3: z.array(z.object({ id: z.string(), text: z.string() })),
    q4: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
});

const PersonViewPropsSchema = z.object({
  name: z.string(),
  speakingTime: z.number().optional(),
  segments: z.array(z.object({
    start: z.number(),
    end: z.number(),
    text: z.string(),
  })).optional(),
});

const ConflictDetectorPropsSchema = z.object({
  conflicts: z.array(z.object({
    type: z.enum(['disagreement', 'concern', 'risk']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    timestamp: z.number().optional(),
    participants: z.array(z.string()).optional(),
  })),
});

const MeetingComparatorPropsSchema = z.object({
  meetings: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    duration: z.number().optional(),
    summary: z.string().optional(),
  })),
});

const TodoDashboardPropsSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    text: z.string(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    completed: z.boolean().optional(),
    meetingId: z.string().optional(),
  })),
  stats: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    overdue: z.number().optional(),
  }).optional(),
});

const RiskPredictorPropsSchema = z.object({
  risks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    probability: z.number().optional(),
    mitigation: z.string().optional(),
  })),
});

const FlashcardGeneratorPropsSchema = z.object({
  suggestedCards: z.array(z.object({
    id: z.string(),
    question: z.string().describe("Question based on meeting content"),
    answer: z.string().describe("Answer extracted from meeting transcript"),
    context: z.string().optional().describe("Context from the meeting"),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe("Difficulty level based on complexity"),
    tags: z.array(z.string()).optional().describe("Topics/keywords from the meeting"),
    sourceMeeting: z.string().optional().describe("Meeting title"),
  })).describe("Auto-generated flashcards from meeting content for learning"),
});


export const tamboComponents: TamboComponent[] = [
  {
    name: 'MeetingSummary',
    description: 'Overall meeting summary with key metrics and highlights. Use when the user asks for a summary, overview, what happened, or a recap of the meeting.',
    component: MeetingSummary,
    propsSchema: MeetingSummaryPropsSchema,
  },
  {
    name: 'DecisionTracker',
    description: 'List of decisions made with owners and confidence levels. Use when the user asks about decisions, what was decided, conclusions, or agreements.',
    component: DecisionTracker,
    propsSchema: DecisionTrackerPropsSchema,
  },
  {
    name: 'ActionItemList',
    description: 'Action items with checkboxes, assignees, and priorities. Use when the user asks about action items, tasks, todos, next steps, or assignments.',
    component: ActionItemList,
    propsSchema: ActionItemListPropsSchema,
  },
  {
    name: 'TopicExplorer',
    description: 'Topics discussed with relevance scores and occurrences. Use when the user asks about topics, themes, subjects, or what was discussed.',
    component: TopicExplorer,
    propsSchema: TopicExplorerPropsSchema,
  },
  {
    name: 'SpeakerAnalytics',
    description: 'Speaking time distribution and participation metrics. Use when the user asks about speakers, who spoke, participation, or talking time.',
    component: SpeakerAnalytics,
    propsSchema: SpeakerAnalyticsPropsSchema,
  },
  {
    name: 'TimelineView',
    description: 'Chronological view of meeting events and key moments. Use when the user asks about timeline, chronology, flow, sequence, or order of events.',
    component: TimelineView,
    propsSchema: TimelineViewPropsSchema,
  },
  {
    name: 'KanbanBoard',
    description: 'Kanban board showing status of items. Use when the user asks about kanban, status, board, or progress tracking.',
    component: KanbanBoard,
    propsSchema: KanbanBoardPropsSchema,
  },
  {
    name: 'SentimentTimeline',
    description: 'Sentiment changes throughout the meeting. Use when the user asks about sentiment, mood, tone, or feelings during the meeting.',
    component: SentimentTimeline,
    propsSchema: SentimentTimelinePropsSchema,
  },
  {
    name: 'PriorityMatrix',
    description: 'Eisenhower 2x2 matrix of urgent vs important. Use when the user asks about priorities, urgent/important matrix, or task organization.',
    component: PriorityMatrix,
    propsSchema: PriorityMatrixPropsSchema,
  },
  {
    name: 'PersonView',
    description: 'Focus view on a specific participant. Use when the user asks about a person, participant, or what someone said.',
    component: PersonView,
    propsSchema: PersonViewPropsSchema,
  },
  {
    name: 'ConflictDetector',
    description: 'Detected disagreements and concerns. Use when the user asks about conflicts, disagreements, concerns, problems, or issues.',
    component: ConflictDetector,
    propsSchema: ConflictDetectorPropsSchema,
  },
  {
    name: 'MeetingComparator',
    description: 'Compare multiple meetings over time. Use when the user asks to compare meetings, track progress across meetings, or see changes over time.',
    component: MeetingComparator,
    propsSchema: MeetingComparatorPropsSchema,
  },
  {
    name: 'TodoDashboard',
    description: 'Personal task dashboard with filters. Use when the user asks about their tasks, personal todos, or task management.',
    component: TodoDashboard,
    propsSchema: TodoDashboardPropsSchema,
  },
  {
    name: 'RiskPredictor',
    description: 'Proactive risk identification. Use when the user asks about risks, potential issues, concerns, or what could go wrong.',
    component: RiskPredictor,
    propsSchema: RiskPredictorPropsSchema,
  },
  {
    name: 'FlashcardGenerator',
    description: 'AUTO-GENERATES study flashcards directly from meeting transcript content. Use when the user asks about flashcards, studying, learning, review, or memorizing meeting content. Automatically extracts key concepts, decisions, and facts and creates question-answer pairs without requiring user input.',
    component: FlashcardGenerator,
    propsSchema: FlashcardGeneratorPropsSchema,
  },
];


export function ComponentRegistry() {
  console.log(`[Tambo] ${tamboComponents.length} components ready for TamboProvider`);
  return null;
}
