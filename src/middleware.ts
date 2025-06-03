import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWTManager } from './lib/jwt-manager';

export async function middleware(request: NextRequest) {
  // Configuração de CORS para requisições OPTIONS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Verificar se é uma rota de proxy
  if (request.nextUrl.pathname.startsWith('/proxy/')) {
    const jwt = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!jwt) {
      return NextResponse.json(
        { error: 'Token JWT não fornecido' },
        { status: 401 }
      );
    }

    try {
      const jwtManager = JWTManager.getInstance();
      const payload = await jwtManager.verifyToken(jwt);
      
      // Adicionar dados do JWT ao request
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-jwt-data', JSON.stringify(payload));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Token JWT inválido' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/proxy/:path*'],
}; 