import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 
  'audio/x-m4a', 'audio/webm', 'audio/ogg',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 
  'video/x-msvideo', 'video/x-matroska',
];

const MAX_AUDIO_SIZE = 200 * 1024 * 1024; 
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; 

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isAudio && !isVideo) {
      return NextResponse.json(
        { error: `File type ${file.type} not supported` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      const maxMb = Math.floor(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Max: ${maxMb}MB` },
        { status: 400 }
      );
    }

    
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `uploads/${timestamp}-${sanitizedName}`;

    
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: file.type,
        size: file.size,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}