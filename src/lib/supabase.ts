import { createClient } from '@supabase/supabase-js';
import { getCleanWebsite, logWebsiteInfo } from './websiteUtils';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Helper functions for common database operations
export const db = {
  // User operations
  users: {
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async updateProfile(userId: string, updates: any) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      return data;
    }
  },
  
  // Chat operations
  chats: {
    async getMessages(chatId: string) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    
    async sendMessage(chatId: string, userId: string, content: string) {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          { chat_id: chatId, user_id: userId, content }
        ]);
      
      if (error) throw error;
      return data;
    }
  },

  // Operações para client_bot_usage baseadas em hostname
  clientBotUsage: {
    async incrementUsage({ hostname, tokens = 0, interactions = 1 }: { hostname?: string, tokens?: number, interactions?: number }) {
      const currentHostname = hostname || getCleanWebsite();
      console.log('[clientBotUsage][incrementUsage] === INICIO ===', { hostname: currentHostname, tokens, interactions });
      
      // Log informações detalhadas do website
      logWebsiteInfo();
      
      // Atualiza registro baseado no hostname
      const { data, error } = await supabase.rpc('update_usage_by_hostname', {
        p_hostname: currentHostname,
        p_tokens: tokens,
        p_interactions: interactions
      });
      
      if (error) {
        console.error('[clientBotUsage][incrementUsage] Erro na função update_usage_by_hostname:', error);
        throw error;
      }
      
      console.log('[clientBotUsage][incrementUsage] === SUCESSO ===', data);
      return data;
    },
    
    async getUsageByHostname(hostname?: string) {
      const currentHostname = hostname || getCleanWebsite();
      console.log('[clientBotUsage][getUsageByHostname] === INICIO ===', { hostname: currentHostname });
      
      const { data, error } = await supabase
        .from('client_bot_usage')
        .select('*')
        .eq('hostname', currentHostname)
        .eq('enabled', true)
        .limit(1);
      
      const usageData = Array.isArray(data) && data.length > 0 ? data[0] : null;
      
      if (error) {
        console.error('[clientBotUsage][getUsageByHostname] Erro na consulta:', error);
        throw error;
      }
      
      console.log('[clientBotUsage][getUsageByHostname] === SUCESSO ===', { usageData });
      return usageData;
    },
    
    // Função para verificar disponibilidade do bot por hostname
    async checkBotAvailability(hostname?: string): Promise<boolean> {
      try {
        const currentHostname = hostname || getCleanWebsite();
        console.log('[clientBotUsage][checkBotAvailability] === INICIO ===', { hostname: currentHostname });
        
        const { data, error } = await supabase.rpc('check_bot_availability_by_hostname', {
          p_hostname: currentHostname
        });

        if (error) {
          console.error('[clientBotUsage][checkBotAvailability] Erro na verificação:', error);
          return false;
        }

        if (!data || !data.available) {
          console.error('[clientBotUsage][checkBotAvailability] Bot não disponível:', {
            hostname: currentHostname,
            error: data?.error,
            error_type: data?.error_type,
            debug_info: data?.debug_info
          });
          
          // Exibir erro detalhado na página baseado no tipo de erro
          if (data?.error_type === 'HOSTNAME_NOT_FOUND') {
            const errorMessage = `❌ HOSTNAME NÃO ENCONTRADO!\n\n` +
              `🔍 Hostname buscado: ${currentHostname}\n` +
              `📊 Variações testadas: ${data.debug_info?.hostname_variations?.join(', ') || 'N/A'}\n` +
              `🔧 Tentativas de busca: hostname exato + website LIKE\n` +
              `📝 Mensagem: ${data.debug_info?.message || 'Registro não encontrado'}\n\n` +
              `💡 SOLUÇÃO: Crie um registro na base de dados para este hostname.`;
            
            console.error(errorMessage);
            
            if (typeof window !== 'undefined') {
              alert(errorMessage);
            }
          } else if (data?.error_type === 'BOT_DISABLED') {
            const errorMessage = `❌ BOT DESABILITADO!\n\n` +
              `🤖 Bot: ${data.bot_info?.bot_name || 'N/A'}\n` +
              `🔍 Hostname: ${currentHostname}\n` +
              `⚠️ Status: Bot está desabilitado para este hostname\n\n` +
              `💡 SOLUÇÃO: Entre em contato com o administrador para habilitar o bot.`;
            
            console.error(errorMessage);
            
            if (typeof window !== 'undefined') {
              alert(errorMessage);
            }
          } else if (data?.error_type === 'INTERACTION_LIMIT_EXCEEDED') {
            const errorMessage = `❌ LIMITE DE INTERAÇÕES EXCEDIDO!\n\n` +
              `📊 Interações atuais: ${data.interaction_info?.current_interactions || 'N/A'}\n` +
              `🎯 Limite disponível: ${data.interaction_info?.available_interactions || 'N/A'}\n` +
              `🔍 Hostname: ${currentHostname}\n\n` +
              `💡 SOLUÇÃO: Entre em contato com o administrador para aumentar o limite.`;
            
            console.error(errorMessage);
            
            if (typeof window !== 'undefined') {
              alert(errorMessage);
            }
          }
          
          return false;
        }

        console.log('[clientBotUsage][checkBotAvailability] === SUCESSO ===', { bot_available: true, data });
        return true;
      } catch (error) {
        console.error('[clientBotUsage][checkBotAvailability] Erro geral:', error);
        return false;
      }
    },
    
    // Função principal para atualizar uso baseado em hostname
    async updateClientUsage({ hostname, tokens = 0, interactions = 1 }: { hostname?: string, tokens?: number, interactions?: number }) {
      try {
        console.log('[clientBotUsage][updateClientUsage] === INICIO ===', { hostname, tokens, interactions });
        
        // Log informações detalhadas do website
        logWebsiteInfo();
        
        // Usa hostname limpo se não fornecido
        const currentHostname = hostname || getCleanWebsite();
        console.log('[clientBotUsage][updateClientUsage] Hostname a ser usado:', currentHostname);
        
        // Verificar disponibilidade do bot antes de tentar atualizar
        const isAvailable = await this.checkBotAvailability(currentHostname);
        if (!isAvailable) {
          throw new Error(`Bot não está disponível para o hostname: ${currentHostname}`);
        }
        
        // Usa a nova função baseada em hostname
        const { data, error } = await supabase.rpc('update_usage_by_hostname', {
          p_hostname: currentHostname,
          p_tokens: tokens,
          p_interactions: interactions
        });

        if (error) {
          console.error('[clientBotUsage][updateClientUsage][DEBUG] Erro na função update_usage_by_hostname:', error);
          throw error;
        }

        console.log('[clientBotUsage][updateClientUsage][DEBUG] Resultado da função update_usage_by_hostname:', data);
        
        if (!data || !data.success) {
          console.error('[clientBotUsage][updateClientUsage][DEBUG] Erro retornado pela função update_usage_by_hostname:', data);
          
          // Se não encontrou registro, exibir erro detalhado
          if (data && data.error_type === 'HOSTNAME_NOT_FOUND') {
            console.error('[clientBotUsage][updateClientUsage][ERRO] Hostname não encontrado na base de dados:', {
              hostname: currentHostname,
              debug_info: data.debug_info
            });
            
            // Exibir erro na página
            const errorMessage = `❌ ERRO: Hostname não encontrado na base de dados!\n\n` +
              `🔍 Hostname buscado: ${currentHostname}\n` +
              `📊 Total de registros na base: ${data.debug_info?.total_records || 'N/A'}\n` +
              `✅ Registros habilitados: ${data.debug_info?.enabled_records || 'N/A'}\n` +
              `🔧 Variações testadas: ${data.debug_info?.hostname_variations?.join(', ') || 'N/A'}\n` +
              `📝 Mensagem: ${data.debug_info?.message || 'Registro não encontrado'}\n\n` +
              `💡 Solução: Verifique se o hostname está correto e se existe um registro habilitado na base de dados.`;
            
            // Exibir erro no console e na página
            console.error(errorMessage);
            
            // Se estiver no navegador, exibir alerta
            if (typeof window !== 'undefined') {
              alert(errorMessage);
            }
            
            throw new Error(`Hostname não encontrado: ${currentHostname}. Verifique a base de dados.`);
          } else if (data && data.error_type === 'INTERACTION_LIMIT_EXCEEDED') {
            const errorMessage = `❌ ERRO: Limite de interações excedido!\n\n` +
              `📊 Interações atuais: ${data.current_interactions || 'N/A'}\n` +
              `🎯 Solicitadas: ${data.requested_interactions || 'N/A'}\n` +
              `🔢 Disponíveis: ${data.available_interactions || 'N/A'}\n` +
              `🔍 Hostname: ${currentHostname}\n\n` +
              `💡 Solução: Entre em contato com o administrador para aumentar o limite.`;
            
            console.error(errorMessage);
            
            if (typeof window !== 'undefined') {
              alert(errorMessage);
            }
            
            throw new Error(`Limite de interações excedido para hostname: ${currentHostname}`);
          }
          
          throw new Error(data?.error || 'Erro desconhecido na função update_usage_by_hostname');
        }
        
        console.log('[clientBotUsage][updateClientUsage][DEBUG] === SUCESSO ===');
        console.log('[clientBotUsage][updateClientUsage][DEBUG] Update realizado:', data);
        return data;
      } catch (error) {
        console.error('[clientBotUsage][updateClientUsage][DEBUG] === ERRO GERAL ===', error);
        
        // Exibir erro na página se for um erro específico
        if (error instanceof Error && (
          error.message.includes('Hostname não encontrado') ||
          error.message.includes('Bot não está disponível') ||
          error.message.includes('Limite de interações')
        )) {
          const errorMessage = `❌ ERRO: ${error.message}\n\n` +
            `🔍 Verifique se o hostname está correto na base de dados.\n` +
            `📊 Consulte os logs do console para mais detalhes.`;
          
          console.error(errorMessage);
          
          // Se estiver no navegador, exibir alerta
          if (typeof window !== 'undefined') {
            alert(errorMessage);
          }
        }
        
        throw error;
      }
    },

    // Função para registrar uso com bot_id (mantida para compatibilidade)
    async registerUsage({
      hostname,
      botId,
      tokensUsed,
      actionType = 'chat'
    }: {
      hostname: string;
      botId: string;
      tokensUsed: number;
      actionType?: string;
    }) {
      try {
        console.log('[clientBotUsage][registerUsage] === INICIO ===', { hostname, botId, tokensUsed, actionType });
        
        // Usar a função baseada em hostname em vez da antiga baseada em website
        const { data, error } = await supabase.rpc('update_usage_by_hostname', {
          p_hostname: hostname,
          p_tokens: tokensUsed,
          p_interactions: 1
        });

        if (error) {
          console.error('[clientBotUsage][registerUsage] Erro ao registrar uso do bot:', error);
          throw error;
        }

        console.log('[clientBotUsage][registerUsage] === SUCESSO ===', data);
        return data;
      } catch (error) {
        console.error('[clientBotUsage][registerUsage] Erro ao registrar uso do bot:', error);
        throw error;
      }
    }
  }
}; 