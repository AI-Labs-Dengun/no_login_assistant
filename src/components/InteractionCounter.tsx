'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { supabase, db } from '../lib/supabase';
import { getCleanWebsite } from '@/lib/websiteUtils';

interface InteractionContextType {
  interactionCount: number;
  addInteraction: () => void;
  resetInteractions: () => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const useInteractionCounter = () => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteractionCounter must be used within an InteractionCounterProvider');
  }
  return context;
};

export const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interactionCount, setInteractionCount] = useState(0);
  const { dark } = useTheme();

  useEffect(() => {
    const loadInteractionCount = async () => {
      try {
        const hostname = getCleanWebsite();
        console.log('[InteractionCounter][loadInteractionCount] === INICIO ===', { hostname });
        
        const usageData = await db.clientBotUsage.getUsageByHostname(hostname);
        
        if (usageData) {
          console.log('[InteractionCounter][loadInteractionCount] Dados carregados:', usageData);
          setInteractionCount(usageData.interactions || 0);
        } else {
          console.log('[InteractionCounter][loadInteractionCount] Nenhum dado encontrado para hostname:', hostname);
          setInteractionCount(0);
        }
      } catch (error) {
        console.error('[InteractionCounter][loadInteractionCount] Erro ao carregar contador:', error);
        setInteractionCount(0);
      }
    };

    loadInteractionCount();
  }, []);

  const addInteraction = () => {
    console.log('[InteractionCounter][addInteraction] Adicionando interação');
    setInteractionCount(prev => prev + 1);
  };

  const resetInteractions = () => {
    console.log('[InteractionCounter][resetInteractions] Resetando contador');
    setInteractionCount(0);
  };

  return (
    <InteractionContext.Provider value={{ interactionCount, addInteraction, resetInteractions }}>
      <div className={`interaction-counter ${dark ? 'dark' : 'light'}`}>
        <div className="counter-display">
          <span className="counter-label">Interações:</span>
          <span className="counter-value">{interactionCount}</span>
        </div>
      </div>
      {children}
    </InteractionContext.Provider>
  );
}; 