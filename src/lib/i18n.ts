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

export const detectMessageLanguage = (message: string): Language => {
  // Lista de palavras comuns em cada idioma para detecção
  const languagePatterns = {
    pt: ['o', 'a', 'e', 'é', 'um', 'uma', 'em', 'no', 'na', 'que', 'como', 'para', 'por', 'com', 'não', 'sim', 'está', 'estou', 'você', 'eu', 'me', 'te', 'se', 'de', 'do', 'da', 'dos', 'das'],
    en: ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must'],
    es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre', 'detrás', 'después', 'antes', 'durante', 'mediante', 'según', 'contra', 'hacia', 'hasta', 'desde', 'que', 'cual', 'quien', 'cuyo', 'donde', 'cuando'],
    fr: ['le', 'la', 'les', 'un', 'une', 'des', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'contre', 'chez', 'vers', 'jusque', 'depuis', 'pendant', 'selon', 'malgré', 'sauf', 'excepté', 'hors', 'que', 'qui', 'dont', 'où', 'quand'],
    de: ['der', 'die', 'das', 'ein', 'eine', 'eines', 'einem', 'einen', 'einer', 'in', 'auf', 'unter', 'über', 'mit', 'ohne', 'für', 'durch', 'gegen', 'bei', 'nach', 'seit', 'während', 'wegen', 'trotz', 'außer', 'dass', 'deren', 'dessen', 'wo', 'wann']
  };

  // Conta a ocorrência de palavras de cada idioma
  const scores: Record<Language, number> = {
    pt: 0,
    en: 0,
    es: 0,
    fr: 0,
    de: 0
  };

  // Converte a mensagem para minúsculas e divide em palavras
  const words = message.toLowerCase().split(/\s+/);

  // Conta as ocorrências de palavras de cada idioma
  words.forEach(word => {
    Object.entries(languagePatterns).forEach(([lang, patterns]) => {
      if (patterns.includes(word)) {
        scores[lang as Language]++;
      }
    });
  });

  // Encontra o idioma com mais ocorrências
  let maxScore = 0;
  let detectedLang: Language = 'en'; // Fallback para inglês

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang as Language;
    }
  });

  return detectedLang;
}; 