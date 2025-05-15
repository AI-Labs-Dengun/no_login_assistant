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
    
    const detectLanguage = () => {
      // 1. Tenta obter o idioma salvo no localStorage
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && ['pt', 'en', 'es', 'fr', 'de'].includes(savedLanguage)) {
        return savedLanguage;
      }

      // 2. Tenta obter o idioma do navegador
      const browserLang = getBrowserLanguage();
      if (browserLang) {
        return browserLang;
      }

      // 3. Fallback para inglês
      return 'en';
    };

    const detectedLang = detectLanguage();
    setLanguage(detectedLang);
    localStorage.setItem('language', detectedLang);
    document.documentElement.lang = detectedLang;
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