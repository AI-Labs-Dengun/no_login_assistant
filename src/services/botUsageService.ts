import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabaseClient
      .rpc('get_bot_by_url', {
        p_website: website,
        p_user_id: userId
      });

    if (error) {
      console.error('Erro ao obter informações do bot:', error);
      throw new Error('Falha ao obter informações do bot');
    }

    if (!data || data.length === 0) {
      throw new Error('Bot não encontrado ou não disponível para este usuário');
    }

    return data[0];
  },

  // Registrar uso do bot usando o consumo real de tokens da LLM
  async registerUsage(
    website: string,
    botId: string,
    tokensUsed: number,
    actionType: string = 'chat'
  ): Promise<UsageResult> {
    try {
      // Primeiro tenta atualizar o registro existente
      const { data: updateData, error: updateError } = await supabaseClient.rpc('update_bot_usage_no_auth', {
        p_website: website,
        p_bot_id: botId,
        p_tokens_used: tokensUsed,
        p_interactions: 1
      });

      // Se não encontrou registro para atualizar, cria um novo
      if (updateError || !updateData) {
        const { data: createData, error: createError } = await supabaseClient.rpc('record_bot_usage_no_auth', {
          p_website: website,
          p_bot_id: botId,
          p_tokens_used: tokensUsed,
          p_interactions: 1
        });

        if (createError) {
          console.error('Erro ao registrar uso do bot:', createError);
          return {
            success: false,
            error: createError.message
          };
        }

        return {
          success: true,
          bot_id: botId,
          tokens_used: tokensUsed,
          interactions: 1,
          ...createData
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