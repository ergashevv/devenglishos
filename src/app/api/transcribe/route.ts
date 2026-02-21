import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Try gpt-4o-mini-transcribe first, fallback to whisper-1
    let transcript = '';
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audio,
        model: 'whisper-1',
        language: 'en',
      });
      transcript = transcription.text;
    } catch (whisperError) {
      console.error('Whisper error:', whisperError);
      throw whisperError;
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
