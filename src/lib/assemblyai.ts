import { AssemblyAI } from 'assemblyai';
import { updateMeetingProgress, saveTranscriptData } from '@/app/actions/meetings';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const MAX_POLLING_ATTEMPTS = 200;
const POLLING_INTERVAL_MS = 3000;


export async function startTranscription(
  meetingId: string,
  audioUrl: string
): Promise<void> {
  
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY is not configured');
  }

  try {
    await updateMeetingProgress(meetingId, 10, 'transcribing');

    
    const transcript = await client.transcripts.create({
      audio_url: audioUrl,
      speech_models: ['universal-2'],
      speaker_labels: true,
      auto_chapters: true,
      auto_highlights: true,
      content_safety: true,
      iab_categories: true,
      sentiment_analysis: true,
      entity_detection: true,
      punctuate: true,
      format_text: true,
      dual_channel: false,
    });

    console.log(`Transcription started: ${transcript.id} for meeting ${meetingId}`);

    
    await pollTranscription(meetingId, transcript.id);

  } catch (error) {
    console.error('Transcription start error:', error);
    await updateMeetingProgress(meetingId, 0, 'error');
    throw error;
  }
}


export async function pollTranscription(
  meetingId: string,
  transcriptId: string,
  attempt: number = 0
): Promise<any> {
  if (attempt >= MAX_POLLING_ATTEMPTS) {
    throw new Error('Transcription polling timeout');
  }

  try {
    const result = await client.transcripts.get(transcriptId);
    console.log(`Polling ${transcriptId}: ${result.status} (attempt ${attempt + 1})`);

    if (result.status === 'completed') {
      
      const transcriptData = extractTranscriptData(result);
      
      await saveTranscriptData(meetingId, {
        transcript: transcriptData.text,
        speakers: transcriptData.speakers,
        duration: transcriptData.duration,
        chapters: transcriptData.chapters,
        sentimentAnalysis: transcriptData.sentimentAnalysis,
      });
      
      console.log(`Meeting ${meetingId} marked as completed with transcript data saved`);
      
      return result;
    }

    if (result.status === 'error') {
      throw new Error(result.error || 'Transcription failed');
    }

    
    const progress = 20 + Math.floor((attempt / MAX_POLLING_ATTEMPTS) * 40);
    await updateMeetingProgress(meetingId, progress);

    
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));

    return pollTranscription(meetingId, transcriptId, attempt + 1);
    
  } catch (error) {
    console.error(`Polling error for ${transcriptId}:`, error);
    await updateMeetingProgress(meetingId, 0, 'error');
    throw error;
  }
}


export function extractTranscriptData(result: any) {
  return {
    text: result.text,
    duration: result.audio_duration,

    speakers: result.utterances?.map((u: any) => ({
      speaker: u.speaker,
      text: u.text,
      start: u.start,
      end: u.end,
      confidence: u.confidence,
    })) || [],

    chapters: result.chapters?.map((c: any) => ({
      start: c.start,
      end: c.end,
      summary: c.summary,
      headline: c.headline,
      gist: c.gist,
    })) || [],

    highlights: result.auto_highlights_result?.results?.map((h: any) => ({
      text: h.text,
      rank: h.rank,
      count: h.count,
      timestamps: h.timestamps,
    })) || [],

    entities: result.entities?.map((e: any) => ({
      type: e.entity_type,
      text: e.text,
      start: e.start,
      end: e.end,
    })) || [],

    sentimentAnalysis: result.sentiment_analysis_results?.map((s: any) => ({
      text: s.text,
      sentiment: s.sentiment,
      confidence: s.confidence,
      start: s.start,
      end: s.end,
    })) || [],
  };
}