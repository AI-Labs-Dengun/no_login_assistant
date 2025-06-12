'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getBrowserLanguage } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setMounted(true);

    // Sempre detecta o idioma do navegador a cada carregamento
    const browserLang = getBrowserLanguage();
    setLanguage(browserLang);
    document.documentElement.lang = browserLang;
  }, []);

  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 