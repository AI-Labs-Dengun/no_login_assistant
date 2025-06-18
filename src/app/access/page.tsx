'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionManager } from '@/lib/session-manager';
import { loggingService } from '@/services/logging';

export default function AccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (token) {
      const session = sessionManager.getSession(token);
      if (session) {
        // Registrar acesso do usuário
        loggingService.logUserAccess(
          token,
          navigator.userAgent,
          window.location.hostname
        );
        // Redirecionar para a interface principal com os dados da sessão
        router.push(`/chat?session=${token}`);
      } else {
        // Tentar validar o token
        sessionManager.validateAndStoreSession(token)
          .then(session => {
            if (session) {
              // Registrar acesso do usuário
              loggingService.logUserAccess(
                token,
                navigator.userAgent,
                window.location.hostname
              );
              router.push(`/chat?session=${token}`);
            } else {
              router.push('/unauthorized');
            }
          })
          .catch(() => {
            router.push('/unauthorized');
          });
      }
    } else {
      router.push('/unauthorized');
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Verificando acesso...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
} 