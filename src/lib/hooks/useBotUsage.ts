import { useEffect, useRef } from 'react';
import { reportBotUsage } from '@/services/usage';
import { sessionManager } from '../session-manager';

interface UseBotUsageProps {
  token: string;
  onError?: (error: Error) => void;
}

export function useBotUsage({ token, onError }: UseBotUsageProps) {
  const startTime = useRef<number>(Date.now());
  const requestCount = useRef<number>(0);
  const tokenCount = useRef<number>(0);

  useEffect(() => {
    const session = sessionManager.getSession(token);
    if (!session) {
      onError?.(new Error('Sessão não encontrada'));
      return;
    }

    // Verificar limite de tokens
    if (tokenCount.current >= session.tokenLimit) {
      onError?.(new Error('Limite de tokens atingido'));
      return;
    }

    // Reportar uso a cada 5 minutos
    const interval = setInterval(() => {
      const duration = Date.now() - startTime.current;
      
      reportBotUsage({
        tokens: tokenCount.current,
        requests: requestCount.current,
        duration,
        userId: session.userId,
        tenantId: session.tenantId,
        botId: session.botId
      });

      // Resetar contadores
      startTime.current = Date.now();
      requestCount.current = 0;
      tokenCount.current = 0;
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      // Reportar uso final
      const duration = Date.now() - startTime.current;
      reportBotUsage({
        tokens: tokenCount.current,
        requests: requestCount.current,
        duration,
        userId: session.userId,
        tenantId: session.tenantId,
        botId: session.botId
      });
    };
  }, [token, onError]);

  const incrementUsage = (tokens: number) => {
    requestCount.current += 1;
    tokenCount.current += tokens;
  };

  return {
    incrementUsage,
    getCurrentUsage: () => ({
      requests: requestCount.current,
      tokens: tokenCount.current,
      duration: Date.now() - startTime.current
    })
  };
} 