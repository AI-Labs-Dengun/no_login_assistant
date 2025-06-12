'use client';

import React, { createContext, useContext, useState } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';

interface InteractionContextType {
  interactionCount: number;
  addInteraction: () => void;
  resetInteractions: () => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interactionCount, setInteractionCount] = useState(0);

  const addInteraction = () => {
    setInteractionCount(prev => prev + 1);
  };

  const resetInteractions = () => {
    setInteractionCount(0);
  };

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