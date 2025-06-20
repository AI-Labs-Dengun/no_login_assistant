import { supabase } from '../lib/supabase';
import { db } from '../lib/supabase';
import { getCleanWebsite, logWebsiteInfo } from '@/lib/websiteUtils';

export interface BotInfo {
  bot_id: string;
  bot_name: string;
  user_id: string;
  tenant_id: string;
  available_interactions: number;
  current_interactions: number;
  status: string;
  enabled: boolean;
  allow_bot_access: boolean;
}

export interface UsageResult {
  success: boolean;
  bot_id?: string;
  tokens_used?: number;
  interactions?: number;
  error?: string;
}

export const botUsageService = {
  // Obter informações do bot pelo hostname e usuário atual
  async getBotInfo(userId: string): Promise<BotInfo> {
    const hostname = getCleanWebsite();
    console.log('[botUsageService][getBotInfo] === INICIO ===', { hostname, userId });

    // Log informações detalhadas do website
    logWebsiteInfo();

    // Buscar diretamente na tabela client_bot_usage usando hostname
    const { data: dataArr, error } = await supabase
      .from('client_bot_usage')
      .select('*')
      .eq('hostname', hostname)
      .eq('user_id', userId)
      .eq('enabled', true)
      .limit(1);
    const data = Array.isArray(dataArr) && dataArr.length > 0 ? dataArr[0] : null;

    console.log('[botUsageService][getBotInfo] Resultado da busca:', data, 'Erro:', error);
    if (data) {
      console.log('[botUsageService][getBotInfo] Dados do bot encontrados:', {
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        bot_id: data.bot_id,
        enabled: data.enabled,
        hostname: data.hostname,
        website: data.website,
        bot_name: data.bot_name,
        status: data.status,
        available_interactions: data.available_interactions,
        current_interactions: data.interactions
      });
    }

    if (error) {
      console.error('[botUsageService][getBotInfo] Erro ao obter informações do bot:', error);
      throw new Error('Falha ao obter informações do bot');
    }

    if (!data) {
      console.error('[botUsageService][getBotInfo] Bot não encontrado:', { hostname, userId });
      throw new Error('Bot não encontrado ou não disponível para este usuário');
    }

    console.log('[botUsageService][getBotInfo] === SUCESSO ===', data);
    return data;
  },

  // Registrar uso do bot usando o consumo real de tokens da LLM
  async registerUsage(
    hostname: string,
    botId: string,
    tokensUsed: number,
    actionType: string = 'chat'
  ): Promise<UsageResult> {
    try {
      console.log('[botUsageService][registerUsage] === INICIO ===', { hostname, botId, tokensUsed, actionType });

      // Log informações detalhadas do website
      logWebsiteInfo();

      // Atualiza o uso do cliente usando a função baseada em hostname
      const { data: clientUsageData, error: clientUsageError } = await db.clientBotUsage.updateClientUsage({
        hostname,
        tokens: tokensUsed,
        interactions: 1
      });

      if (clientUsageError) {
        console.error('[botUsageService][registerUsage] Erro ao atualizar uso do cliente:', clientUsageError);
        return {
          success: false,
          error: clientUsageError.message
        };
      }

      console.log('[botUsageService][registerUsage] Uso do cliente atualizado:', clientUsageData);

      // Atualiza o uso do bot usando a função baseada em hostname
      const { data: updateData, error: updateError } = await supabase.rpc('update_usage_by_hostname', {
        p_hostname: hostname,
        p_tokens: tokensUsed,
        p_interactions: 1
      });

      console.log('[botUsageService][registerUsage] Resultado da atualização:', { updateData, updateError });

      if (updateError) {
        console.error('[botUsageService][registerUsage] Erro ao atualizar uso do bot:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      console.log('[botUsageService][registerUsage] === SUCESSO ===', { updateData });

      return {
        success: true,
        bot_id: botId,
        tokens_used: tokensUsed,
        interactions: 1,
        ...updateData
      };
    } catch (error) {
      console.error('[botUsageService][registerUsage] Erro ao registrar uso:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  // Função para obter o consumo de tokens da LLM
  async getLLMTokenUsage(message: string, conversationHistory: any[] = []): Promise<number> {
    try {
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationHistory
        })
      });

      const data = await response.json();
      return data.tokenCount || 0;
    } catch (error) {
      console.error('Erro ao obter consumo de tokens:', error);
      return 0;
    }
  }
}; 