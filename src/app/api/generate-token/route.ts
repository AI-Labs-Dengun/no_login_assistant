import { NextRequest, NextResponse } from 'next/server';
import { JWTManager } from '@/lib/jwt-manager';

export async function POST(req: NextRequest) {
  try {
    const { botId, tenantId, permissions } = await req.json();

    if (!botId || !tenantId || !permissions) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    const jwtManager = JWTManager.getInstance();
    const token = await jwtManager.generateToken({
      botId,
      tenantId,
      permissions,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar token' },
      { status: 500 }
    );
  }
} 