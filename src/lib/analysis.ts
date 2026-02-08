import { analyzeMeetingWithOpenRouter, answerQueryWithOpenRouter } from './openrouter';
import type { 
  Meeting, 
  Speaker, 
  Decision, 
  ActionItem, 
  Topic, 
  NextStep, 
  Risk, 
  SentimentData, 
  KeyMoment,
  QueryResponse,
  ComparisonResult 
} from '@/types';


export async function analyzeMeeting(
  transcript: string,
  speakers?: Speaker[]
): Promise<{
  summary: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  topics: Topic[];
  nextSteps: NextStep[];
  risks: Risk[];
  sentiment: SentimentData;
  keyMoments: KeyMoment[];
}> {
  return analyzeMeetingWithOpenRouter(transcript, speakers);
}


export async function answerQuery(
  meeting: Meeting,
  query: string,
  includedMeetings?: Meeting[]
): Promise<QueryResponse> {
  return answerQueryWithOpenRouter(meeting, query, includedMeetings);
}


export async function compareMeetings(
  meetings: Array<Pick<Meeting, 'id' | 'title' | 'createdAt' | 'summary' | 'decisions' | 'actionItems' | 'topics' | 'sentiment'>>
): Promise<ComparisonResult> {
  try {
    const context = meetings.map(m => ({
      id: m.id,
      title: m.title,
      date: m.createdAt,
      summary: m.summary,
      decisions: m.decisions,
      actionItems: m.actionItems?.filter(a => a.completed).length + '/' + m.actionItems?.length,
      topics: m.topics?.map((t: Topic) => t.name),
      sentiment: m.sentiment?.overall,
    }));

    return {
      meetings: meetings.map(m => m.id),
      patterns: [],
      trends: { sentiment: [], productivity: [], topicEvolution: [] },
      insights: ['Comparison feature using Tambo AI - implementation pending'],
    };

  } catch (error) {
    console.error('Comparison error:', error);
    return {
      meetings: meetings.map(m => m.id),
      patterns: [],
      trends: { sentiment: [], productivity: [], topicEvolution: [] },
      insights: ['Unable to generate comparison insights at this time.'],
    };
  }
}


function shapeComponentData(type: string, data: any, meeting: Meeting): any {
  switch (type) {
    case 'speaker_analytics':
      return {
        speakers: meeting.speakers?.map(s => ({
          name: s.name,
          speakingTime: s.speakingTime,
          percentage: meeting.duration ? (s.speakingTime / meeting.duration) * 100 : 0,
        })) || [],
        ...data,
      };

    case 'action_item_list':
      return {
        items: meeting.actionItems?.map(item => ({
          ...item,
          meetingId: meeting.id,
        })) || [],
        filters: data.filters || {},
      };

    case 'decision_tracker':
      return {
        decisions: meeting.decisions || [],
        ...data,
      };

    case 'topic_explorer':
      return {
        topics: meeting.topics || [],
        ...data,
      };

    case 'sentiment_timeline':
      return {
        timeline: meeting.sentiment?.timeline || [],
        overall: meeting.sentiment?.overall,
        ...data,
      };

    case 'timeline_view':
      return {
        chapters: meeting.chapters || [],
        keyMoments: meeting.keyMoments || [],
        duration: meeting.duration,
        ...data,
      };

    case 'risk_predictor':
      return {
        risks: meeting.risks || [],
        ...data,
      };

    case 'priority_matrix':
      const items = meeting.actionItems || [];
      return {
        quadrants: {
          q1: items.filter((i: ActionItem) => i.priority === 'urgent' && !i.completed),
          q2: items.filter((i: ActionItem) => i.priority === 'high' && !i.completed),
          q3: items.filter((i: ActionItem) => i.priority === 'medium' && !i.completed),
          q4: items.filter((i: ActionItem) => i.priority === 'low' || i.completed),
        },
        ...data,
      };

    default:
      return data;
  }
}
