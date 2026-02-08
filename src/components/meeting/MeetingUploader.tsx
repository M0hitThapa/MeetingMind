'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createMeeting } from '@/app/actions/meetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { MeetingStatus } from '@/types';
import {
  Upload, FileAudio, FileVideo, X, 
  CheckCircle2, AlertCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_AUDIO_SIZE = 200 * 1024 * 1024;

const ALLOWED_TYPES = {
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
};

export function MeetingUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isAudio = ALLOWED_TYPES.audio.includes(file.type);
    const isVideo = ALLOWED_TYPES.video.includes(file.type);

    if (!isAudio && !isVideo) {
      return { valid: false, error: 'Unsupported file type' };
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      return { valid: false, error: `Max size: ${Math.floor(maxSize / 1024 / 1024)}MB` };
    }

    return { valid: true };
  };

  const clearIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, []);

  const pollMeetingStatus = (id: string) => {
    setStatus('Processing video...');
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/meetings/${id}/status`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const meeting = data.data;
          
          
          let processingProgress = 0;
          switch (meeting.status) {
            case 'uploading':
              processingProgress = 10;
              setStatus('Uploading to cloud...');
              break;
            case 'transcribing':
              processingProgress = 30 + (meeting.progress * 0.6);
              setStatus('Transcribing audio...');
              break;
            case 'analyzing':
              processingProgress = 90 + (meeting.progress * 0.1);
              setStatus('Analyzing with AI...');
              break;
            case 'completed':
              processingProgress = 100;
              setStatus('Complete! Redirecting...');
              clearIntervals();
              setTimeout(() => {
                router.push(`/meetings/${id}`);
                router.refresh();
              }, 800);
              return;
            case 'error':
              clearIntervals();
              setError('Processing failed. Please try again.');
              setIsProcessing(false);
              setProgress(0);
              return;
          }
          
          
          setProgress(50 + (processingProgress * 0.5));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const validation = validateFile(droppedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(droppedFile);
    if (!title) {
      setTitle(droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setStatus('Preparing upload...');

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      
      const startTime = Date.now();
      const estimatedUploadTime = Math.min(file.size / (1024 * 1024) * 100, 15000); 
      
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / estimatedUploadTime, 1);
        
        const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
        const newProgress = Math.round(easedProgress * 50);
        
        setProgress(newProgress);
        
        if (newProgress < 20) {
          setStatus('Uploading file...');
        } else if (newProgress < 40) {
          setStatus('Uploading...');
        } else {
          setStatus('Almost done uploading...');
        }
      }, 100);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      clearIntervals();

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { data: uploadData } = await uploadRes.json();
      setProgress(50);
      setStatus('Creating meeting record...');

      const isVideo = ALLOWED_TYPES.video.includes(file.type);
      
      const result = await createMeeting({
        title,
        audioUrl: uploadData.url,
        fileType: isVideo ? 'video' : 'audio',
        hasVideo: isVideo,
      });

      if (!result.success || !result.data?.id) {
        throw new Error(result.error || 'Failed to create meeting');
      }

      setProgress(55);
      
      
      pollMeetingStatus(result.data.id);

    } catch (err) {
      clearIntervals();
      if ((err as Error).name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    clearIntervals();
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
  };

  const clearFile = () => {
    if (isProcessing) cancelUpload();
    setFile(null);
    setTitle('');
    setError(null);
    setProgress(0);
    setStatus('');
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-10 h-10 text-muted-foreground" />;
    if (ALLOWED_TYPES.video.includes(file.type)) {
      return <FileVideo className="w-10 h-10 text-blue-500" />;
    }
    return <FileAudio className="w-10 h-10 text-green-500" />;
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-yellow-500" />
          Quick Upload
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Meeting Title</label>
          <Input
            placeholder="Enter title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isProcessing}
            className="h-9"
          />
        </div>

        
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer bg-muted/30",
              dragActive && "border-primary bg-primary/5 scale-[1.02]",
              isProcessing && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-3">
                {getFileIcon()}
                <div className="space-y-1">
                  <p className="font-medium">
                    {dragActive ? 'Drop here' : 'Click or drag file'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, M4A, MP4, MOV • Max 500MB
                  </p>
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {ALLOWED_TYPES.video.includes(file.type) ? 'Video' : 'Audio'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              {!isProcessing && (
                <Button variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{status}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm p-2.5 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        
        <div className="flex gap-2">
          {isProcessing ? (
            <Button onClick={cancelUpload} variant="outline" className="flex-1">
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!file || !title}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Now
            </Button>
          )}
        </div>

        
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            Files upload directly to cloud storage. Transcription starts automatically after upload.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
