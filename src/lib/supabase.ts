import { createClient } from '@supabase/supabase-js';

// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        .single();
      if (error) throw error;
      return data;
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