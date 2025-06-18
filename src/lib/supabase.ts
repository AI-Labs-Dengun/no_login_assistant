import { createClient } from '@supabase/supabase-js';

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

  // Operações para client_bot_usage
  clientBotUsage: {
    async incrementUsage({ website, tokens = 0, interactions = 1 }: { website: string, tokens?: number, interactions?: number }) {
      // Atualiza ou insere registro para o website
      const { data, error } = await supabase.rpc('increment_client_bot_usage', {
        website_param: website,
        tokens_param: tokens,
        interactions_param: interactions
      });
      if (error) throw error;
      return data;
    },
    async getUsageByWebsite(website: string) {
      const { data, error } = await supabase
        .from('client_bot_usage')
        .select('*')
        .eq('website', website)
        .limit(1);
      const usageData = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (error) throw error;
      return usageData;
    },
    async updateClientUsage({ website, tokens = 0, interactions = 1 }: { website: string, tokens?: number, interactions?: number }) {
      try {
        console.log('[clientBotUsage][updateClientUsage] INICIO', { website, tokens, interactions });
        
        // Busca registro existente
        const { data: existingDataArr, error: checkError } = await supabase
          .from('client_bot_usage')
          .select('*')
          .eq('website', website)
          .eq('enabled', true)
          .limit(1);
        console.log('[clientBotUsage][updateClientUsage][DEBUG] Resultado da busca:', existingDataArr, 'Erro:', checkError, 'website:', website);
        const existingData = Array.isArray(existingDataArr) && existingDataArr.length > 0 ? existingDataArr[0] : null;

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('[clientBotUsage][updateClientUsage][DEBUG] Erro na consulta à tabela client_bot_usage:', checkError);
          throw checkError;
        }

        if (!existingData) {
          console.log('[clientBotUsage][updateClientUsage][DEBUG] Nenhum registro encontrado, tentando inicializar...');
          
          // Usar função de inicialização
          const { initializeBotUsageForCurrentWebsite } = await import('./initializeBotUsage');
          const initialized = await initializeBotUsageForCurrentWebsite();
          
          if (!initialized) {
            throw new Error(`Não foi possível inicializar registro para o website: ${website}`);
          }
          
          // Tentar buscar novamente após inicialização
          const { data: newDataArr, error: newCheckError } = await supabase
            .from('client_bot_usage')
            .select('*')
            .eq('website', website)
            .eq('enabled', true)
            .limit(1);
          
          if (newCheckError) throw newCheckError;
          const newData = Array.isArray(newDataArr) && newDataArr.length > 0 ? newDataArr[0] : null;
          
          if (!newData) {
            throw new Error(`Registro não encontrado após inicialização para o website: ${website}`);
          }
          
          // Atualizar o registro recém-criado
          const updatePayload = {
            tokens_used: (newData.tokens_used || 0) + tokens,
            interactions: (newData.interactions || 0) + interactions,
            updated_at: new Date().toISOString()
          };
          
          const { data: finalData, error: finalError } = await supabase
            .from('client_bot_usage')
            .update(updatePayload)
            .eq('id', newData.id)
            .select()
            .single();
            
          if (finalError) throw finalError;
          console.log('[clientBotUsage][updateClientUsage][DEBUG] Registro inicializado e atualizado:', finalData);
          return finalData;
        }

        // Atualiza o registro existente apenas incrementando
        const updatePayload = {
          tokens_used: (existingData.tokens_used || 0) + tokens,
          interactions: (existingData.interactions || 0) + interactions,
          updated_at: new Date().toISOString()
        };
        console.log('[clientBotUsage][updateClientUsage][DEBUG] Payload para update:', updatePayload);
        const { data, error } = await supabase
          .from('client_bot_usage')
          .update(updatePayload)
          .eq('website', website)
          .eq('enabled', true)
          .select()
          .limit(1);
        console.log('[clientBotUsage][updateClientUsage][DEBUG] Resultado do update:', data, 'Erro:', error);

        const updatedData = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (error) {
          console.error('[clientBotUsage][updateClientUsage][DEBUG] Erro ao atualizar registro:', error);
          throw error;
        }
        console.log('[clientBotUsage][updateClientUsage][DEBUG] Update realizado com sucesso:', updatedData);
        return updatedData;
      } catch (error) {
        console.error('[clientBotUsage][updateClientUsage][DEBUG] Erro geral:', error);
        throw error;
      }
    },
    async registerUsage({
      website,
      botId,
      tokensUsed,
      actionType = 'chat'
    }: {
      website: string;
      botId: string;
      tokensUsed: number;
      actionType?: string;
    }) {
      try {
        const { data, error } = await supabase.rpc('register_public_bot_usage', {
          p_website: website,
          p_bot_id: botId,
          p_tokens_used: tokensUsed,
          p_action_type: actionType
        });

        if (error) {
          console.error('Erro ao registrar uso do bot:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Erro ao registrar uso do bot:', error);
        throw error;
      }
    }
  }
}; 