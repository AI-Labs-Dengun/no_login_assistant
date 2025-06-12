import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Processa a requisição
    const data = await request.json();
    
    // 2. Retorna resposta
    return NextResponse.json({
      success: true,
      data: {
        message: "Requisição processada com sucesso",
        receivedData: data
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
} 