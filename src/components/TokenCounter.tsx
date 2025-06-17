'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { createClient } from '@supabase/supabase-js';

interface TokenContextType {
  tokenCount: number;
  addTokens: (count: number) => void;
  resetTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const addTokens = async (count: number) => {
    const newCount = tokenCount + count;
    setTokenCount(newCount);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: botData } = await supabase
          .from('super_bots')
          .select('id, website')
          .eq('website', window.location.origin)
          .single();

        if (botData) {
          await supabase.rpc('sync_counters', {
            p_website: window.location.origin,
            p_bot_id: botData.id,
            p_token_count: newCount,
            p_interaction_count: 0 // Será atualizado pelo InteractionCounter
          });
        }
      }
    } catch (error) {
      console.error('Error syncing token count:', error);
    }
  };

  const resetTokens = async () => {
    setTokenCount(0);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: botData } = await supabase
          .from('super_bots')
          .select('id, website')
          .eq('website', window.location.origin)
          .single();

        if (botData) {
          await supabase.rpc('sync_counters', {
            p_website: window.location.origin,
            p_bot_id: botData.id,
            p_token_count: 0,
            p_interaction_count: 0
          });
        }
      }
    } catch (error) {
      console.error('Error resetting token count:', error);
    }
  };

  // Carregar contador inicial
  useEffect(() => {
    const loadInitialCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: botData } = await supabase
            .from('super_bots')
            .select('id, website')
            .eq('website', window.location.origin)
            .single();

          if (botData) {
            const { data: counters } = await supabase.rpc('get_current_counters', {
              p_website: window.location.origin,
              p_bot_id: botData.id
            });

            if (counters && counters.length > 0) {
              setTokenCount(counters[0].tokens_used);
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial token count:', error);
      }
    };

    loadInitialCount();
  }, []);

  return (
    <TokenContext.Provider value={{ tokenCount, addTokens, resetTokens }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenCounter = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenCounter must be used within a TokenProvider');
  }
  return context;
};

export const TokenCounter: React.FC = () => {
  const { tokenCount } = useTokenCounter();
  const { dark } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-200 dark:bg-white/20 rounded-lg px-4 py-2 shadow-lg border border-gray-300 dark:border-white/30">
      <p className="text-sm text-gray-900 dark:text-white">
        Tokens GPT: {tokenCount}
      </p>
    </div>
  );
};

export { TokenProvider }; 