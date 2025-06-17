import { useState, useEffect } from 'react';
import { botUsageService, BotInfo, UsageResult } from '../services/botUsageService';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

export const useBotUsage = () => {
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      initializeBot();
    }
  }, [user?.id]);

  const initializeBot = async () => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const info = await botUsageService.getBotInfo(user.id);
      setBotInfo(info);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao inicializar bot';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBotUsage = async (tokensUsed: number) => {
    if (!user || !botInfo) return;

    try {
      const result = await botUsageService.registerUsage(
        window.location.origin,
        botInfo.bot_id,
        tokensUsed
      );

      if (!result.success) {
        console.error('Erro ao registrar uso do bot:', result.error);
        toast({
          title: 'Erro',
          description: 'Falha ao registrar uso do bot',
          status: 'error',
        });
        return;
      }

      // Atualizar o estado local com as novas informações
      setBotInfo(prev => prev ? {
        ...prev,
        current_interactions: (prev.current_interactions || 0) + 1,
        available_interactions: (prev.available_interactions || 0) - 1
      } : null);

    } catch (error) {
      console.error('Erro ao registrar uso do bot:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao registrar uso do bot',
        status: 'error',
      });
    }
  };

  const canInteract = (): boolean => {
    if (!botInfo || !user?.id) return false;
    return (
      botInfo.enabled &&
      botInfo.status === 'active' &&
      botInfo.allow_bot_access &&
      botInfo.current_interactions < botInfo.available_interactions
    );
  };

  const getRemainingInteractions = (): number => {
    if (!botInfo) return 0;
    return Math.max(0, botInfo.available_interactions - botInfo.current_interactions);
  };

  const getAccessStatus = (): {
    hasAccess: boolean;
    isActive: boolean;
    hasInteractions: boolean;
    reason?: string;
  } => {
    if (!botInfo) {
      return {
        hasAccess: false,
        isActive: false,
        hasInteractions: false,
        reason: 'Informações do bot não disponíveis'
      };
    }

    if (!botInfo.allow_bot_access) {
      return {
        hasAccess: false,
        isActive: false,
        hasInteractions: false,
        reason: 'Acesso não autorizado'
      };
    }

    if (botInfo.status !== 'active') {
      return {
        hasAccess: true,
        isActive: false,
        hasInteractions: false,
        reason: 'Bot inativo'
      };
    }

    if (botInfo.current_interactions >= botInfo.available_interactions) {
      return {
        hasAccess: true,
        isActive: true,
        hasInteractions: false,
        reason: 'Limite de interações atingido'
      };
    }

    return {
      hasAccess: true,
      isActive: true,
      hasInteractions: true
    };
  };

  return {
    botInfo,
    isLoading,
    error,
    updateBotUsage,
    canInteract,
    getRemainingInteractions,
    getAccessStatus,
    refreshBotInfo: initializeBot
  };
}; 