import { supabase } from '../lib/supabase';
import { db } from '../lib/supabase';

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
  bot_name?: string;
  tokens_used?: number;
  interactions?: number;
  available_interactions?: number;
  last_used?: string;
  error?: string;
}

export const botUsageService = {
  // Obter informações do bot pela URL e usuário atual
  async getBotInfo(userId: string): Promise<BotInfo> {
    const website = window.location.origin;
    console.log('Obtendo informações do bot:', { website, userId });

    // Buscar diretamente na tabela client_bot_usage
    const { data, error } = await supabase
      .from('client_bot_usage')
      .select('*')
      .eq('website', website)
      .eq('user_id', userId)
      .eq('enabled', true)
      .single();

    console.log('Resultado da busca do bot em client_bot_usage:', { data, error });

    if (error) {
      console.error('Erro ao obter informações do bot:', error);
      throw new Error('Falha ao obter informações do bot');
    }

    if (!data) {
      console.error('Bot não encontrado:', { website, userId });
      throw new Error('Bot não encontrado ou não disponível para este usuário');
    }

    console.log('Bot encontrado:', data);
    return data;
  },

  // Registrar uso do bot usando o consumo real de tokens da LLM
  async registerUsage(
    website: string,
    botId: string,
    tokensUsed: number,
    actionType: string = 'chat'
  ): Promise<UsageResult> {
    try {
      console.log('Iniciando registro de uso:', { website, botId, tokensUsed, actionType });

      // Atualiza o uso do cliente
      const { data: clientUsageData, error: clientUsageError } = await db.clientBotUsage.updateClientUsage({
        website,
        tokens: tokensUsed,
        interactions: 1
      });

      if (clientUsageError) {
        console.error('Erro ao atualizar uso do cliente:', clientUsageError);
        return {
          success: false,
          error: clientUsageError.message
        };
      }

      // Atualiza o uso do bot
      const { data: updateData, error: updateError } = await supabase.rpc('update_bot_usage_no_auth', {
        p_website: website,
        p_bot_id: botId,
        p_tokens_used: tokensUsed,
        p_interactions: 1
      });

      console.log('Resultado da atualização:', { updateData, updateError });

      if (updateError) {
        console.error('Erro ao atualizar uso do bot:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      return {
        success: true,
        bot_id: botId,
        tokens_used: tokensUsed,
        interactions: 1,
        ...updateData
      };
    } catch (error) {
      console.error('Erro ao registrar uso:', error);
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