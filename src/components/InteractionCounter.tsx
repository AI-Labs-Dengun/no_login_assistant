'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { supabase, db } from '../lib/supabase';
import { getWebsiteUrl } from '../lib/utils';

interface InteractionContextType {
  interactionCount: number;
  addInteraction: () => void;
  resetInteractions: () => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interactionCount, setInteractionCount] = useState(0);

  // Função para obter a URL do website
  const getWebsite = () => {
    const website = getWebsiteUrl();
    console.log('[InteractionCounter][getWebsite] Valor de website buscado:', website);
    return website;
  };

  const addInteraction = async () => {
    const newCount = interactionCount + 1;
    setInteractionCount(newCount);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await db.clientBotUsage.updateClientUsage({
          website: getWebsite(),
          tokens: 0,
          interactions: 1
        });
      }
    } catch (error) {
      console.error('Error syncing interaction count:', error);
    }
  };

  const resetInteractions = async () => {
    setInteractionCount(0);
    // Não faz update no banco, apenas local
  };

  // Carregar contador inicial
  useEffect(() => {
    const loadInitialCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: usageDataArr, error } = await supabase
            .from('client_bot_usage')
            .select('*')
            .eq('website', getWebsite())
            .eq('enabled', true)
            .limit(1);
          const usageData = Array.isArray(usageDataArr) && usageDataArr.length > 0 ? usageDataArr[0] : null;
          if (error) {
            console.error('[InteractionCounter][loadInitialCount] Erro ao buscar usageData:', error);
          }
          if (usageData) {
            setInteractionCount(usageData.interactions || 0);
          } else {
            console.warn('[InteractionCounter][loadInitialCount] Nenhum usageData encontrado para o website:', getWebsite());
          }
        }
      } catch (error) {
        console.error('Error loading initial interaction count:', error);
      }
    };
    loadInitialCount();
  }, []);

  return (
    <InteractionContext.Provider value={{ interactionCount, addInteraction, resetInteractions }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteractionCounter = () => {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error('useInteractionCounter must be used within an InteractionProvider');
  }
  return context;
};

export const InteractionCounter: React.FC = () => {
  const { interactionCount } = useInteractionCounter();
  const { dark } = useTheme();

  return (
    <div className="fixed bottom-4 left-4 bg-gray-200 dark:bg-white/20 rounded-lg px-4 py-2 shadow-lg border border-gray-300 dark:border-white/30">
      <p className="text-sm text-gray-900 dark:text-white">
        Interações: {interactionCount}
      </p>
    </div>
  );
};

export { InteractionProvider }; 