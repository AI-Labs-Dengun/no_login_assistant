'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import { createClient } from '@supabase/supabase-js';

interface InteractionContextType {
  interactionCount: number;
  addInteraction: () => void;
  resetInteractions: () => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interactionCount, setInteractionCount] = useState(0);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const addInteraction = async () => {
    const newCount = interactionCount + 1;
    setInteractionCount(newCount);
    
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
            p_token_count: 0, // Será atualizado pelo TokenCounter
            p_interaction_count: newCount
          });
        }
      }
    } catch (error) {
      console.error('Error syncing interaction count:', error);
    }
  };

  const resetInteractions = async () => {
    setInteractionCount(0);
    
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
      console.error('Error resetting interaction count:', error);
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
              setInteractionCount(counters[0].interactions);
            }
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