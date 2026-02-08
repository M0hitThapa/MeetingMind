
export type FileType = 'audio' | 'video';

export type MeetingStatus = 
  | 'pending' 
  | 'uploading' 
  | 'transcribing' 
  | 'analyzing' 
  | 'completed' 
  | 'error';

export type TaskStatus = 
  | 'todo' 
  | 'in_progress' 
  | 'blocked' 
  | 'completed' 
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type EnergyLevel = 'high' | 'medium' | 'low';

export type FollowUpType = 'email' | 'slack' | 'sms' | 'in_app';

export type FollowUpStatus = 'pending' | 'scheduled' | 'sent' | 'failed';

export type CardType = 
  | 'basic' 
  | 'cloze' 
  | 'multiple_choice' 
  | 'definition' 
  | 'concept';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SentimentType = 'positive' | 'neutral' | 'negative';





export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  thumbnailUrl?: string;
  frameRate?: number;
  codec?: string;
}

export interface Speaker {
  id: string;
  name: string;
  speakingTime: number; 
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface Chapter {
  id: string;
  start: number;
  end: number;
  summary: string;
  headline: string;
  gist: string;
}

export interface Decision {
  id: string;
  text: string;
  owner?: string;
  confidence: number; 
  timestamp: number; 
  context?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string; 
  priority: TaskPriority;
  completed: boolean;
  context?: string;
  meetingId?: string;
}

export interface Topic {
  name: string;
  relevance: number; 
  occurrences: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface NextStep {
  text: string;
  priority: TaskPriority;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  assignee?: string;
  dependencies?: string[];
}

export interface Risk {
  level: RiskLevel;
  description: string;
  mitigation?: string;
  probability?: number; 
  impact?: 'low' | 'medium' | 'high';
  relatedDecisions?: string[]; 
}

export interface SentimentData {
  overall: SentimentType;
  score: number; 
  timeline: Array<{
    timestamp: number;
    sentiment: SentimentType;
    score: number;
    text: string;
  }>;
  speakers?: Record<string, {
    overall: SentimentType;
    score: number;
  }>;
}

export interface KeyMoment {
  type: 'decision' | 'action_item' | 'insight' | 'concern' | 'agreement' | 'disagreement';
  timestamp: number;
  description: string;
  importance: number; 
  speakers?: string[];
  relatedTopics?: string[];
}






export interface Meeting {
  id: string;
  title: string;
  createdAt: string; 
  updatedAt: string;
  
  
  audioUrl?: string;
  fileType: FileType;
  hasVideo: boolean;
  videoMetadata?: VideoMetadata;
  
  
  status: MeetingStatus;
  progress: number;
  
  
  transcript?: string;
  speakers?: Speaker[];
  chapters?: Chapter[];
  duration?: number;
  
  
  summary?: string;
  decisions?: Decision[];
  actionItems?: ActionItem[];
  topics?: Topic[];
  nextSteps?: NextStep[];
  
  
  risks?: Risk[];
  sentiment?: SentimentData;
  keyMoments?: KeyMoment[];
  
  
  queries?: Query[];
  followUps?: FollowUp[];
  tasks?: Task[];
  flashcards?: Flashcard[];
}


export interface Query {
  id: string;
  meetingId: string;
  query: string;
  response: QueryResponse;
  components?: ComponentConfig[];
  voiceInput: boolean;
  createdAt: string;
  
  meeting?: Meeting;
}


export interface FollowUp {
  id: string;
  meetingId: string;
  actionItemId: string;
  type: FollowUpType;
  recipient?: string;
  status: FollowUpStatus;
  scheduledFor?: string;
  sentAt?: string;
  metadata?: {
    subject?: string;
    message?: string;
    channelId?: string;
  };
  createdAt: string;
  
  meeting?: Meeting;
}






export interface Task {
  id: string;
  meetingId: string;
  actionItemId?: string;
  
  
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  
  owner?: string;
  delegatedTo?: string;
  
  
  dueDate?: string;
  scheduledFor?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  
  
  category?: 'work' | 'personal' | 'learning' | 'admin';
  tags: string[];
  project?: string;
  
  
  blockedBy: string[];
  blocking: string[];
  
  
  context?: string;
  energyLevel?: EnergyLevel;
  
  
  meeting?: Meeting;
  parentTaskId?: string;
  parentTask?: Task;
  subtasks?: Task[];
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  owner?: string;
  category?: string[];
  tags?: string[];
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  completedToday: number;
  completedThisWeek: number;
  overdue: number;
  upcoming: number; 
  averageCompletionTime?: number;
}

export interface DependencyGraph {
  nodes: Array<{
    id: string;
    title: string;
    status: TaskStatus;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'blocks' | 'blocked_by';
  }>;
}






export interface Flashcard {
  id: string;
  meetingId: string;
  deckId?: string;
  
  
  cardType: CardType;
  question: string;
  answer: string;
  context?: string;
  
  
  options: string[];
  correctOption?: number;
  
  
  clozeText?: string;
  
  
  category?: string;
  tags: string[];
  importance: number;
  difficulty: number;
  
  
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReviewed?: string;
  
  
  timesReviewed: number;
  timesCorrect: number;
  averageTime?: number;
  
  
  meeting?: Meeting;
  deck?: FlashcardDeck;
  reviews?: FlashcardReview[];
}


export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  
  
  newCardsPerDay: number;
  reviewLimit: number;
  
  
  totalCards: number;
  matureCards: number;
  
  createdAt: string;
  updatedAt: string;
  
  cards?: Flashcard[];
}


export interface FlashcardReview {
  id: string;
  flashcardId: string;
  
  rating: number; 
  timeSpent: number;
  wasCorrect: boolean;
  previousInterval: number;
  previousEase: number;
  
  reviewedAt: string;
  
  flashcard?: Flashcard;
}


export interface ReviewSession {
  deckId?: string;
  cards: Flashcard[];
  currentIndex: number;
  stats: {
    reviewed: number;
    correct: number;
    timeSpent: number;
  };
}

export interface ReviewResult {
  flashcardId: string;
  rating: number;
  timeSpent: number;
  nextReview: string;
  newInterval: number;
  newEaseFactor: number;
}

export interface StudyStats {
  totalCards: number;
  dueToday: number;
  newCards: number;
  reviewedToday: number;
  streakDays: number;
  averageRetention: number;
  totalStudyTime: number;
  cardsByDifficulty: Record<number, number>;
}






export type ComponentType =
  
  | 'meeting_summary'
  | 'decision_tracker'
  | 'action_item_list'
  | 'topic_explorer'
  | 'speaker_analytics'
  | 'timeline_view'
  | 'kanban_board'
  | 'network_graph'
  | 'heat_map'
  | 'comparison_matrix'
  | 'priority_matrix'
  | 'sentiment_timeline'
  | 'quick_stats'
  | 'person_view'
  | 'conflict_detector'
  
  
  | 'video_timeline_view'
  | 'meeting_comparator'
  | 'risk_predictor'
  | 'deadline_forecast'
  | 'trend_analyzer'
  
  
  | 'todo_dashboard'
  | 'kanban_board_enhanced'
  | 'gtd_inbox'
  | 'eisenhower_matrix'
  | 'time_blocking_calendar'
  | 'dependency_graph'
  | 'productivity_insights'
  
  
  | 'flashcard_generator'
  | 'flashcard_reviewer'
  | 'study_dashboard'
  | 'deck_manager'
  | 'flashcard_editor'
  | 'learning_insights';


export interface ComponentConfig {
  type: ComponentType;
  data: unknown;
  priority?: 'high' | 'medium' | 'low';
  layout?: 'full' | 'half' | 'third' | 'card';
  title?: string;
  description?: string;
}


export interface QueryResponse {
  answer: string;
  components: ComponentConfig[];
  suggestedFollowUps?: string[];
  confidence?: number; 
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}





export interface FollowUpAction {
  actionItemId: string;
  type: FollowUpType;
  recipient: string;
  scheduledFor?: string;
  message?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'docx' | 'txt';
  include?: {
    transcript?: boolean;
    summary?: boolean;
    decisions?: boolean;
    actionItems?: boolean;
    speakers?: boolean;
    topics?: boolean;
  };
  filters?: {
    speakers?: string[];
    timeRange?: { start: number; end: number };
  };
}

export interface ComparisonResult {
  meetings: string[]; 
  patterns: Array<{
    type: 'topic' | 'decision' | 'sentiment' | 'action';
    description: string;
    occurrences: Array<{
      meetingId: string;
      timestamp: number;
      context: string;
    }>;
  }>;
  trends: {
    sentiment?: Array<{ date: string; score: number }>;
    productivity?: Array<{ date: string; actionItemsCompleted: number }>;
    topicEvolution?: Array<{ topic: string; timeline: Array<{ date: string; relevance: number }> }>;
  };
  insights: string[];
}





export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    timestamp: string;
  };
}





export type CreateMeetingInput = Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'queries' | 'followUps' | 'tasks' | 'flashcards'>;

export type UpdateMeetingInput = Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateTaskInput = Omit<Task, 'id' | 'meeting' | 'parentTask' | 'subtasks'>;

export type CreateFlashcardInput = Omit<Flashcard, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'timesReviewed' | 'timesCorrect' | 'meeting' | 'deck' | 'reviews'>;


export function isMeeting(obj: unknown): obj is Meeting {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'title' in obj;
}

export function isTask(obj: unknown): obj is Task {
  return typeof obj === 'object' && obj !== null && 'title' in obj && 'status' in obj;
}

export function isFlashcard(obj: unknown): obj is Flashcard {
  return typeof obj === 'object' && obj !== null && 'question' in obj && 'answer' in obj;
}