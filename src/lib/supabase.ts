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
        // Primeiro verifica se existe um registro para o website
        const { data: existingDataArr, error: checkError } = await supabase
          .from('client_bot_usage')
          .select('*')
          .eq('website', website)
          .limit(1);
        const existingData = Array.isArray(existingDataArr) && existingDataArr.length > 0 ? existingDataArr[0] : null;

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
          console.error('[clientBotUsage][updateClientUsage] Erro ao buscar registro:', checkError);
          throw checkError;
        }

        if (!existingData) {
          console.error(`[clientBotUsage][updateClientUsage] Nenhum registro encontrado para o website: ${website}`);
          throw new Error(`Nenhum registro encontrado para o website: ${website}`);
        }

        // Atualiza o registro existente
        const updatePayload = {
          tokens_used: (existingData.tokens_used || 0) + tokens,
          interactions: (existingData.interactions || 0) + interactions,
          updated_at: new Date().toISOString()
        };
        console.log('[clientBotUsage][updateClientUsage] Payload para update:', updatePayload);
        const { data, error } = await supabase
          .from('client_bot_usage')
          .update(updatePayload)
          .eq('website', website)
          .select()
          .limit(1);

        const updatedData = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (error) {
          console.error('[clientBotUsage][updateClientUsage] Erro ao atualizar registro:', error);
          throw error;
        }
        console.log('[clientBotUsage][updateClientUsage] Update realizado com sucesso:', updatedData);
        return updatedData;
      } catch (error) {
        console.error('[clientBotUsage][updateClientUsage] Erro geral:', error);
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