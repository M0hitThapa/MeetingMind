import type { ComponentType } from '@/types';


export interface TamboComponentProps<T = unknown> {
  data: T;
  className?: string;
}


export interface ComponentConfig {
  type: ComponentType;
  data: unknown;
  priority?: 'high' | 'medium' | 'low';
  layout?: 'full' | 'half' | 'third' | 'card';
  title?: string;
  description?: string;
}





export interface MeetingSummaryData {
  summary: string;
  keyPoints?: string[];
  duration?: number;
  participantCount?: number;
  decisionCount?: number;
  actionItemCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  meetingDate?: string;
}

export interface Decision {
  id: string;
  text: string;
  owner?: string;
  confidence: number;
  timestamp?: number;
  context?: string;
  category?: string;
}

export interface DecisionTrackerData {
  decisions: Decision[];
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  meetingId?: string;
  tags?: string[];
  description?: string;
}

export interface ActionItemListData {
  items: ActionItem[];
  filters?: {
    status?: 'all' | 'completed' | 'pending';
    priority?: string;
    assignee?: string;
    meetingId?: string;
  };
}

export interface Topic {
  name: string;
  relevance: number;
  occurrences: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  relatedTopics?: string[];
}

export interface TopicExplorerData {
  topics: Topic[];
  totalTopics?: number;
  dominantTopic?: string;
}

export interface Speaker {
  name: string;
  speakingTime: number;
  percentage: number;
  segments?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  interventions?: number;
  email?: string;
  avatar?: string;
}

export interface SpeakerAnalyticsData {
  speakers: Speaker[];
  totalSpeakingTime?: number;
  mostActiveSpeaker?: string;
}

export interface TimelineEvent {
  timestamp: number;
  type: 'chapter' | 'key_moment' | 'decision' | 'action' | 'sentiment_shift' | 'topic_change';
  title: string;
  description?: string;
  importance?: number;
  speaker?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface TimelineViewData {
  events: TimelineEvent[];
  duration: number;
  chapters?: Array<{ start: number; end: number; title: string }>;
}

export interface SentimentPoint {
  timestamp: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  text: string;
  speaker?: string;
}

export interface SentimentTimelineData {
  timeline: SentimentPoint[];
  overall: 'positive' | 'neutral' | 'negative';
  averageScore?: number;
  volatility?: number;
}

export interface KanbanTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

export interface KanbanBoardData {
  tasks: KanbanTask[];
  columns?: string[];
}

export interface NetworkNode {
  id: string;
  name: string;
  role?: string;
  group?: string;
  value?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  value?: number;
  type?: 'spoke_to' | 'responded_to' | 'mentioned';
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centralNode?: string;
}

export interface HeatMapCell {
  x: string;
  y: string;
  value: number;
  intensity?: 'low' | 'medium' | 'high';
}

export interface HeatMapData {
  cells: HeatMapCell[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
}

export interface ComparisonMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participantCount: number;
  decisionCount: number;
  actionItemCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ComparisonMatrixData {
  meetings: ComparisonMeeting[];
  metrics: string[];
}

export interface PriorityQuadrant {
  id: string;
  text: string;
  priority: string;
  urgency: number;
  importance: number;
}

export interface PriorityMatrixData {
  quadrants: {
    q1: PriorityQuadrant[]; 
    q2: PriorityQuadrant[]; 
    q3: PriorityQuadrant[]; 
    q4: PriorityQuadrant[]; 
  };
}

export interface QuickStatsData {
  duration?: number;
  participantCount?: number;
  decisionCount?: number;
  actionItemCount?: number;
  messageCount?: number;
  topicCount?: number;
  avgSentiment?: number;
  speakingTime?: number;
}

export interface PersonData {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  speakingTime: number;
  percentage: number;
  contributions: string[];
  decisionsOwned: Decision[];
  actionItems: ActionItem[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topicsDiscussed: string[];
}

export interface PersonViewData {
  person: PersonData;
  meetingsAttended?: number;
}

export interface Conflict {
  id: string;
  type: 'disagreement' | 'concern' | 'risk' | 'blocker';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  participants: string[];
  timestamp: number;
  status: 'open' | 'resolved' | 'mitigated';
  resolution?: string;
}

export interface ConflictDetectorData {
  conflicts: Conflict[];
  totalRisks?: number;
  resolvedCount?: number;
}





export interface VideoChapter {
  start: number;
  end: number;
  title: string;
  summary?: string;
  thumbnail?: string;
}

export interface VideoTimelineViewData {
  videoUrl: string;
  duration: number;
  chapters: VideoChapter[];
  currentTime?: number;
}

export interface TrendPoint {
  date: string;
  value: number;
  metric: string;
  meetingId?: string;
}

export interface MeetingComparatorData {
  trends: TrendPoint[];
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    metrics: Record<string, number>;
    sentiment?: string;
  }>;
  insights: string[];
}

export interface Risk {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  category: string;
  mitigation?: string;
  owner?: string;
  detectedAt: string;
  status: 'identified' | 'mitigated' | 'accepted' | 'resolved';
}

export interface RiskPredictorData {
  risks: Risk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskTrend: 'improving' | 'stable' | 'worsening';
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'on_track' | 'at_risk' | 'overdue' | 'completed';
  daysRemaining: number;
  meetingId?: string;
}

export interface DeadlineForecastData {
  deadlines: Deadline[];
  forecast: {
    week: string;
    due: number;
    atRisk: number;
    overdue: number;
  }[];
}

export interface TrendAnalyzerData {
  metrics: Array<{
    name: string;
    data: Array<{ date: string; value: number }>;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  }>;
  period: string;
  insights: string[];
}





export interface Task extends ActionItem {
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'completed';
  project?: string;
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: Task[];
  completedAt?: string;
}

export interface TodoDashboardData {
  tasks: Task[];
  stats: {
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
    inProgress: number;
    blocked: number;
  };
  projects?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  limit?: number;
}

export interface KanbanBoardEnhancedData {
  columns: KanbanColumn[];
  swimlanes?: string[];
}

export interface GTDItem {
  id: string;
  text: string;
  type: 'inbox' | 'reference' | 'someday' | 'project' | 'next_action' | 'waiting';
  processed: boolean;
  project?: string;
  context?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface GTDInboxData {
  items: GTDItem[];
  unprocessedCount: number;
  processedToday: number;
}

export type EisenhowerMatrixData = PriorityMatrixData

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'deep_work' | 'meeting' | 'admin' | 'break' | 'task';
  tasks?: string[];
  energy?: 'high' | 'medium' | 'low';
}

export interface TimeBlockingCalendarData {
  blocks: TimeBlock[];
  date: string;
  energyMap?: Record<string, 'high' | 'medium' | 'low'>;
}

export interface DependencyNode {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  dependents: string[];
  criticalPath?: boolean;
}

export interface DependencyGraphData {
  nodes: DependencyNode[];
  criticalPathLength?: number;
  blockedCount?: number;
}

export interface ProductivityMetric {
  date: string;
  tasksCompleted: number;
  focusTime: number;
  efficiency: number;
  interruptions: number;
}

export interface ProductivityInsightsData {
  metrics: ProductivityMetric[];
  insights: string[];
  recommendations: string[];
  streakDays: number;
  bestPerformingDay?: string;
  peakHours?: number[];
}





export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: string;
  nextReview?: string;
  interval?: number;
  repetitions?: number;
  easeFactor?: number;
  deckId?: string;
  tags?: string[];
  sourceMeeting?: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  dueCount: number;
  newCount: number;
  lastStudied?: string;
  createdAt: string;
  category?: string;
}

export interface FlashcardGeneratorData {
  suggestedCards: Flashcard[];
  sourceText?: string;
  meetingId?: string;
  deckId?: string;
}

export interface FlashcardReviewerData {
  cards: Flashcard[];
  currentIndex: number;
  sessionStats?: {
    reviewed: number;
    correct: number;
    streak: number;
  };
}

export interface StudyStats {
  totalCards: number;
  dueToday: number;
  newCards: number;
  reviewedToday: number;
  streakDays: number;
  averageRetention: number;
  totalStudyTime: number;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weakestAreas?: string[];
  strongestAreas?: string[];
}

export type StudyDashboardData = StudyStats

export interface DeckManagerData {
  decks: FlashcardDeck[];
  recentDecks?: string[];
  sharedDecks?: FlashcardDeck[];
}

export interface FlashcardEditorData {
  card?: Flashcard;
  deckId?: string;
  mode: 'create' | 'edit';
  suggestedQuestions?: string[];
}

export interface LearningInsight {
  topic: string;
  retention: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastStudied: string;
  nextReview: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface LearningInsightsData {
  insights: LearningInsight[];
  overallProgress: number;
  studyPatterns: {
    dayOfWeek: string;
    averageCards: number;
    averageTime: number;
  }[];
  recommendations: string[];
}