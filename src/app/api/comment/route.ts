import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // You can process/store the comment here if needed
  return NextResponse.json({ success: true });
} 