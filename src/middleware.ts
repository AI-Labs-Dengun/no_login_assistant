import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionManager } from './lib/session-manager';
import { config as urlConfig } from './config/urls';
import type { SessionData } from './lib/session-manager';

export async function middleware(request: NextRequest) {
  // Verificar se é uma rota que requer autenticação
  if (!request.nextUrl.pathname.startsWith('/access')) {
    return NextResponse.next();
  }

  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/unauthorized', urlConfig.botUrl));
  }

  // Verificar se já existe uma sessão válida
  let session: SessionData | undefined | null = sessionManager.getSession(token);
  
  if (!session) {
    // Tentar validar e criar nova sessão
    session = await sessionManager.validateAndStoreSession(token);
    if (!session) {
      return NextResponse.redirect(new URL('/unauthorized', urlConfig.botUrl));
    }
  }

  // Verificar se precisa renovar o token
  if (sessionManager.shouldRefreshToken(token)) {
    // Redirecionar para o dashboard para renovar o token
    return NextResponse.redirect(
      new URL(`/bots/refresh?bot_id=${session.botId}&tenant_id=${session.tenantId}`, urlConfig.dashboardUrl)
    );
  }

  // Atualizar timestamp de atividade
  sessionManager.updateSessionActivity(token);

  // Adicionar dados da sessão ao request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-session-data', JSON.stringify(session));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/access/:path*',
}; 