import { useEffect, useRef } from 'react';
import { botIntegration } from '@/services/bot-integration';

interface UseBotUsageProps {
  tenantId: string;
  userId: string;
  onError?: (error: Error) => void;
}

export function useBotUsage({ tenantId, userId, onError }: UseBotUsageProps) {
  const startTime = useRef<number>(Date.now());
  const requestCount = useRef<number>(0);
  const tokenCount = useRef<number>(0);

  useEffect(() => {
    // Reportar uso a cada 5 minutos
    const interval = setInterval(async () => {
      try {
        // Reportar uso de tokens
        await botIntegration.reportTokenUsage(
          tenantId,
          userId,
          tokenCount.current,
          'periodic_report'
        );

        // Resetar contadores
        startTime.current = Date.now();
        requestCount.current = 0;
        tokenCount.current = 0;
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Erro ao reportar uso'));
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      // Reportar uso final
      botIntegration.reportTokenUsage(
        tenantId,
        userId,
        tokenCount.current,
        'session_end'
      ).catch(error => {
        onError?.(error instanceof Error ? error : new Error('Erro ao reportar uso final'));
      });
    };
  }, [tenantId, userId, onError]);

  const incrementUsage = async (tokens: number, endpoint: string) => {
    requestCount.current += 1;
    tokenCount.current += tokens;
    
    try {
      // Reportar uso de tokens
      await botIntegration.reportTokenUsage(
        tenantId,
        userId,
        tokens,
        endpoint
      );
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Erro ao reportar uso'));
    }
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