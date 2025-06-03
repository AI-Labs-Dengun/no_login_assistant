import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Verifica se é uma requisição OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  // 2. Permite acesso à rota chatgpt sem autenticação
  if (request.nextUrl.pathname.startsWith('/api/chatgpt')) {
    return NextResponse.next();
  }

  // 3. Verifica se tem token para outras rotas
  const token = request.headers.get('authorization');
  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Token não fornecido' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 4. Continua a requisição
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
}; 