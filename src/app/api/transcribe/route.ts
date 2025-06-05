import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Language } from '@/lib/i18n';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert Blob to File for OpenAI
    const audioFile = new File([file], 'audio.wav', { type: file.type || 'audio/wav' });

    // Call OpenAI Whisper API sem forçar o idioma
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'json',
    });

    // Mapeia o código de idioma do Whisper para nosso tipo Language
    const languageMap: Record<string, Language> = {
      'pt': 'pt',
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de'
    };

    // Pega os dois primeiros caracteres do código de idioma (ex: 'pt-BR' -> 'pt')
    const detectedLanguage = (transcription as any).language?.split('-')[0] || 'en';
    const mappedLanguage = languageMap[detectedLanguage] || 'en';

    return NextResponse.json({ 
      text: transcription.text,
      language: mappedLanguage
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
} 