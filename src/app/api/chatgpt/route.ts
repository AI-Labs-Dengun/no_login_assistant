import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function POST(req: Request) {
  try {
    const { message, conversationHistory = [] } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Read instructions and knowledge from public directory
    const instructions = await fs.readFile(path.join(process.cwd(), 'public', 'AI_INSTRUCTIONS.md'), 'utf-8');
    const knowledge = await fs.readFile(path.join(process.cwd(), 'public', 'AI_KNOWLEDGE.md'), 'utf-8');

    // Create a single, comprehensive system message
    const systemMessage = `You are the AI assistant of Dengun, a Startup Studio and Digital Agency based in Faro, Portugal. Your role is to help visitors understand Dengun's services and guide them through their digital transformation journey.

    [INSTRUCTIONS]
    ${instructions}

    [KNOWLEDGE BASE]
    ${knowledge}

    CRITICAL LANGUAGE INSTRUCTIONS:
    - You MUST ALWAYS respond in the EXACT SAME LANGUAGE as the user's message
    - If the user writes in Portuguese, you MUST respond in Portuguese
    - If the user writes in Spanish, you MUST respond in Spanish
    - If the user writes in French, you MUST respond in French
    - If the user writes in German, you MUST respond in German
    - If the user writes in English, you MUST respond in English
    - NEVER translate or change the language of your response
    - NEVER mention language or your ability to assist in other languages
    - NEVER start your response with language-related phrases

    ADDITIONAL GUIDELINES:
    - Be creative and original in your responses
    - Use the tone and style defined in the instructions
    - Incorporate relevant information from the knowledge base
    - Never copy examples directly from the instructions
    - Avoid starting your responses with greetings (hello, hi, etc) or affirmations (sure, yes, etc)
    - Respond directly and naturally, as in a real conversation
    - Keep your responses concise and objective
    - Use colloquial and friendly language while maintaining professionalism
    - Consider the context of the previous conversation to provide more accurate and relevant responses`;

    // Prepara o array de mensagens incluindo o histórico
    const messages: ChatMessage[] = [
      { role: "system", content: systemMessage }
    ];

    // Adiciona o histórico da conversa se existir
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { user: string; content: string }) => {
        messages.push({
          role: msg.user === 'me' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Adiciona a mensagem atual
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.8,
      max_tokens: 1000,
    });

    return NextResponse.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('ChatGPT error:', error);
    return NextResponse.json({ error: 'Failed to get response from ChatGPT' }, { status: 500 });
  }
} 