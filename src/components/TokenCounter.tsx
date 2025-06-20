'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { supabase, db } from '../lib/supabase';
import { getCleanWebsite } from '@/lib/websiteUtils';

interface TokenContextType {
  tokenCount: number;
  addTokens: (count: number) => void;
  resetTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useTokenCounter = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenCounter must be used within a TokenCounterProvider');
  }
  return context;
};

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const { dark } = useTheme();

  useEffect(() => {
    const loadTokenCount = async () => {
      try {
        const hostname = getCleanWebsite();
        console.log('[TokenCounter][loadTokenCount] === INICIO ===', { hostname });
        
        const usageData = await db.clientBotUsage.getUsageByHostname(hostname);
        
        if (usageData) {
          console.log('[TokenCounter][loadTokenCount] Dados carregados:', usageData);
          setTokenCount(usageData.tokens_used || 0);
        } else {
          console.log('[TokenCounter][loadTokenCount] Nenhum dado encontrado para hostname:', hostname);
          setTokenCount(0);
        }
      } catch (error) {
        console.error('[TokenCounter][loadTokenCount] Erro ao carregar contador:', error);
        setTokenCount(0);
      }
    };

    loadTokenCount();
  }, []);

  const addTokens = (count: number) => {
    console.log('[TokenCounter][addTokens] Adicionando tokens:', count);
    setTokenCount(prev => prev + count);
  };

  const resetTokens = () => {
    console.log('[TokenCounter][resetTokens] Resetando contador');
    setTokenCount(0);
  };

  return (
    <TokenContext.Provider value={{ tokenCount, addTokens, resetTokens }}>
      <div className={`token-counter ${dark ? 'dark' : 'light'}`}>
        <div className="counter-display">
          <span className="counter-label">Tokens:</span>
          <span className="counter-value">{tokenCount}</span>
        </div>
      </div>
      {children}
    </TokenContext.Provider>
  );
}; 