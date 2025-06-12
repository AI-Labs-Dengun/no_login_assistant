import { NextResponse } from 'next/server';

let currentInteractionCount = 0;

export async function GET() {
  return NextResponse.json({ interactionCount: currentInteractionCount });
}

export async function POST() {
  currentInteractionCount += 1;
  return NextResponse.json({ interactionCount: currentInteractionCount });
}

export async function DELETE() {
  currentInteractionCount = 0;
  return NextResponse.json({ interactionCount: currentInteractionCount });
} 