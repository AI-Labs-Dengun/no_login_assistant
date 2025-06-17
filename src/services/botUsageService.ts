import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabase
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

    const botInfo = data[0];

    // Verificar se o usuário tem acesso ao bot
    if (!botInfo.allow_bot_access) {
      throw new Error('Acesso ao bot não autorizado para este usuário');
    }

    // Verificar se o bot está ativo para o usuário
    if (botInfo.status !== 'active') {
      throw new Error('Bot está inativo para este usuário');
    }

    // Verificar se ainda há interações disponíveis
    if (botInfo.current_interactions >= botInfo.available_interactions) {
      throw new Error('Limite de interações atingido para este usuário');
    }

    return botInfo;
  },

  // Atualizar uso do bot
  async updateUsage(
    website: string,
    userId: string,
    tenantId: string,
    botId: string,
    tokensUsed: number,
    interactions: number
  ): Promise<UsageResult> {
    try {
      // Primeiro, verificar se o usuário ainda tem acesso
      const { data: accessData, error: accessError } = await supabase
        .from('super_tenant_users')
        .select('allow_bot_access')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();

      if (accessError || !accessData?.allow_bot_access) {
        return {
          success: false,
          error: 'Acesso ao bot não autorizado para este usuário'
        };
      }

      // Se tiver acesso, atualizar o uso
      const { data, error } = await supabase
        .rpc('update_bot_usage', {
          p_website: website,
          p_user_id: userId,
          p_tenant_id: tenantId,
          p_bot_id: botId,
          p_tokens_used: tokensUsed,
          p_interactions: interactions
        });

      if (error) {
        console.error('Erro ao atualizar uso do bot:', error);
        throw new Error('Falha ao atualizar uso do bot');
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar uso:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}; 