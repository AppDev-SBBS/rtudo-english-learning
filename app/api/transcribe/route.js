// /app/api/transcribe/route.js (or .ts)
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('audio');

  if (!file) {
    return NextResponse.json({ error: 'No audio file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await openai.audio.transcriptions.create({
    file: new File([buffer], 'speech.webm'),
    model: 'whisper-1',
    response_format: 'json',
    language: 'en',
  });

  return NextResponse.json({ text: response.text });
}
