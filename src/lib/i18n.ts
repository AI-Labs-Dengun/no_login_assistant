import pt from './translations/pt.json';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';

export type Language = 'pt' | 'en' | 'es' | 'fr' | 'de';

export const translations = {
  pt,
  en,
  es,
  fr,
  de,
};

export const languageNames: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export const getBrowserLanguage = (): Language => {
  // Tenta obter o idioma principal do navegador
  const browserLang = navigator.language.split('-')[0];
  
  // Verifica se o idioma é suportado
  if (['pt', 'en', 'es', 'fr', 'de'].includes(browserLang)) {
    return browserLang as Language;
  }

  // Tenta obter o primeiro idioma preferido do usuário
  const preferredLang = navigator.languages[0]?.split('-')[0];
  if (preferredLang && ['pt', 'en', 'es', 'fr', 'de'].includes(preferredLang)) {
    return preferredLang as Language;
  }

  // Fallback para inglês
  return 'en';
};

export const useTranslation = (language: Language) => {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    // Tenta obter a tradução no idioma atual
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Se não encontrar no idioma atual, tenta em inglês
        value = translations['en'];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key;
          }
        }
        return typeof value === 'string' ? value : key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t };
}; 