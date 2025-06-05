import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mapeamento de idiomas para vozes
const languageToVoice: Record<string, string> = {
  'pt': 'nova',
  'en': 'alloy',
  'es': 'echo',
  'fr': 'fable',
  'de': 'onyx'
};

export async function POST(req: Request) {
  try {
    const { text, language = 'pt' } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Seleciona a voz apropriada para o idioma
    const voice = languageToVoice[language] || 'nova';

    // Call OpenAI TTS API
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
    });

    // The response is a ReadableStream (Node.js)
    // Convert to a buffer and return as audio/mpeg
    const buffer = Buffer.from(await response.arrayBuffer());
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate TTS audio' }, { status: 500 });
  }
} 