'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { supabase } from '../lib/supabase';

interface TokenContextType {
  tokenCount: number;
  addTokens: (count: number) => void;
  resetTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenCount, setTokenCount] = useState(0);

  // Função para obter a URL do website
  const getWebsite = () => {
    let origin = window.location.origin.replace(/^http:\/\//, 'https://');
    if (!origin.endsWith('/')) origin += '/';
    console.log('[TokenCounter][getWebsite] Valor de website buscado:', origin);
    return origin;
  };

  const addTokens = async (count: number) => {
    const newCount = tokenCount + count;
    setTokenCount(newCount);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: usageData, error } = await supabase
          .from('client_bot_usage')
          .select('*')
          .eq('website', getWebsite())
          .eq('enabled', true)
          .single();
        if (error) {
          console.error('[TokenCounter][addTokens] Erro ao buscar usageData:', error);
        }
        if (usageData) {
          const { data: updateResult, error: updateError } = await supabase
            .from('client_bot_usage')
            .update({ tokens_used: newCount, updated_at: new Date().toISOString() })
            .eq('id', usageData.id)
            .select();
          if (updateError) {
            console.error('[TokenCounter][addTokens] Erro ao atualizar tokens:', updateError);
          } else {
            console.log('[TokenCounter][addTokens] Tokens atualizados:', updateResult);
          }
        } else {
          console.warn('[TokenCounter][addTokens] Nenhum usageData encontrado para o website:', getWebsite());
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
        const { data: usageData, error } = await supabase
          .from('client_bot_usage')
          .select('*')
          .eq('website', getWebsite())
          .eq('enabled', true)
          .single();
        if (error) {
          console.error('[TokenCounter][resetTokens] Erro ao buscar usageData:', error);
        }
        if (usageData) {
          const { data: updateResult, error: updateError } = await supabase
            .from('client_bot_usage')
            .update({ tokens_used: 0, updated_at: new Date().toISOString() })
            .eq('id', usageData.id)
            .select();
          if (updateError) {
            console.error('[TokenCounter][resetTokens] Erro ao resetar tokens:', updateError);
          } else {
            console.log('[TokenCounter][resetTokens] Tokens resetados:', updateResult);
          }
        } else {
          console.warn('[TokenCounter][resetTokens] Nenhum usageData encontrado para o website:', getWebsite());
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
          const { data: usageData, error } = await supabase
            .from('client_bot_usage')
            .select('*')
            .eq('website', getWebsite())
            .eq('enabled', true)
            .single();
          if (error) {
            console.error('[TokenCounter][loadInitialCount] Erro ao buscar usageData:', error);
          }
          if (usageData) {
            setTokenCount(usageData.tokens_used || 0);
          } else {
            console.warn('[TokenCounter][loadInitialCount] Nenhum usageData encontrado para o website:', getWebsite());
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