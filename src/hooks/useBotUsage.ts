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

  const updateUsage = async (tokensUsed: number, interactions: number = 1): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        status: 'error',
      });
      return false;
    }

    if (!botInfo) {
      toast({
        title: 'Erro',
        description: 'Informações do bot não disponíveis',
        status: 'error',
      });
      return false;
    }

    try {
      const result = await botUsageService.updateUsage(
        window.location.origin,
        user.id,
        botInfo.tenant_id,
        botInfo.bot_id,
        tokensUsed,
        interactions
      );

      if (!result.success) {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao atualizar uso do bot',
          status: 'error',
        });
        return false;
      }

      // Atualizar informações do bot com os novos valores
      setBotInfo(prev => prev ? {
        ...prev,
        current_interactions: result.interactions || prev.current_interactions,
        available_interactions: result.available_interactions || prev.available_interactions
      } : null);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar uso';
      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
      });
      return false;
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
    updateUsage,
    canInteract,
    getRemainingInteractions,
    getAccessStatus,
    refreshBotInfo: initializeBot
  };
}; 