import { NextResponse } from 'next/server';

let currentTokenCount = 0;

export async function GET() {
  return NextResponse.json({ tokenCount: currentTokenCount });
}

export async function POST(request: Request) {
  const { count } = await request.json();
  
  if (typeof count === 'number') {
    currentTokenCount += count;
    return NextResponse.json({ tokenCount: currentTokenCount });
  }
  
  return NextResponse.json({ error: 'Invalid token count' }, { status: 400 });
}

export async function DELETE() {
  currentTokenCount = 0;
  return NextResponse.json({ tokenCount: currentTokenCount });
} 