'use client';

import React, { createContext, useContext, useState } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';

interface TokenContextType {
  tokenCount: number;
  addTokens: (count: number) => void;
  resetTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenCount, setTokenCount] = useState(0);

  const addTokens = (count: number) => {
    setTokenCount(prev => prev + count);
  };

  const resetTokens = () => {
    setTokenCount(0);
  };

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