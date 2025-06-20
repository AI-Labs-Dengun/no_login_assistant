/**
 * Utilitários para gerenciamento de URLs de websites e hostnames
 * Funções unificadas para obter e validar URLs de websites e extrair hostnames
 */

export interface WebsiteInfo {
  fullUrl: string;
  cleanUrl: string;
  hostname: string;
  protocol: string;
  isValid: boolean;
}

/**
 * Função unificada para obter a URL do website atual
 * Retorna diferentes formatos dependendo do contexto
 */
export function getWebsite(): string {
  if (typeof window === 'undefined') {
    console.warn('[getWebsite] Executando no servidor, retornando string vazia');
    return '';
  }

  let origin = window.location.origin;
  
  // Garante que sempre use HTTPS
  origin = origin.replace(/^http:\/\//, 'https://');
  
  // Adiciona barra final se não existir
  if (!origin.endsWith('/')) {
    origin += '/';
  }
  
  console.log('[getWebsite] URL obtida:', origin);
  return origin;
}

/**
 * Função para obter informações detalhadas do website
 */
export function getWebsiteInfo(): WebsiteInfo {
  if (typeof window === 'undefined') {
    return {
      fullUrl: '',
      cleanUrl: '',
      hostname: '',
      protocol: '',
      isValid: false
    };
  }

  const url = new URL(window.location.href);
  const fullUrl = url.href;
  const cleanUrl = url.origin + '/';
  const hostname = url.hostname;
  const protocol = url.protocol;

  return {
    fullUrl,
    cleanUrl,
    hostname,
    protocol,
    isValid: true
  };
}

/**
 * Função para obter apenas o hostname limpo (sem protocolo e barra final)
 * Esta função é usada para busca na base de dados por hostname
 */
export function getCleanWebsite(): string {
  if (typeof window === 'undefined') {
    console.warn('[getCleanWebsite] Executando no servidor, retornando string vazia');
    return '';
  }
  
  let hostname = window.location.hostname;
  
  // Normalizar hostname: remover www se houver e converter para lowercase
  hostname = hostname.toLowerCase();
  
  console.log('[getCleanWebsite] Hostname limpo obtido:', hostname);
  return hostname;
}

/**
 * Função para extrair hostname de uma URL (versão cliente)
 */
export function extractHostname(url: string): string {
  if (!url) return '';
  
  try {
    // Se não tem protocolo, adiciona https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    
    console.log('[extractHostname] Hostname extraído:', hostname, 'da URL:', url);
    return hostname;
  } catch (error) {
    console.error('[extractHostname] Erro ao extrair hostname da URL:', url, error);
    return '';
  }
}

/**
 * Função para normalizar hostname (remover www e converter para lowercase)
 */
export function normalizeHostname(hostname: string): string {
  if (!hostname) return '';
  
  let normalized = hostname.toLowerCase().trim();
  
  // Remover www. se houver
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }
  
  console.log('[normalizeHostname] Hostname normalizado:', normalized, 'do original:', hostname);
  return normalized;
}

/**
 * Função para obter variações do hostname (com e sem www)
 */
export function getHostnameVariations(hostname: string): string[] {
  if (!hostname) return [];
  
  const normalized = normalizeHostname(hostname);
  const variations: string[] = [];
  
  // Adicionar variação sem www
  variations.push(normalized);
  
  // Adicionar variação com www
  variations.push('www.' + normalized);
  
  // Adicionar hostname original se diferente das normalizadas
  const original = hostname.toLowerCase().trim();
  if (original !== normalized && original !== ('www.' + normalized)) {
    variations.push(original);
  }
  
  console.log('[getHostnameVariations] Variações geradas:', variations, 'para hostname:', hostname);
  return variations;
}

/**
 * Função para validar se uma URL é válida
 */
export function isValidWebsite(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Função para normalizar uma URL (garantir formato consistente)
 */
export function normalizeWebsite(url: string): string {
  if (!url) return '';
  
  try {
    // Se não tem protocolo, adiciona https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    // Garante que sempre use HTTPS
    urlObj.protocol = 'https:';
    
    // Adiciona barra final se não existir
    if (!urlObj.pathname.endsWith('/')) {
      urlObj.pathname += '/';
    }
    
    return urlObj.href;
  } catch (error) {
    console.error('[normalizeWebsite] Erro ao normalizar URL:', url, error);
    return url;
  }
}

/**
 * Função para logar informações detalhadas sobre o website atual
 */
export function logWebsiteInfo(): void {
  if (typeof window === 'undefined') {
    console.log('[logWebsiteInfo] Executando no servidor');
    return;
  }

  const info = getWebsiteInfo();
  const cleanHostname = getCleanWebsite();
  const hostname = window.location.hostname;
  const variations = getHostnameVariations(hostname);
  
  console.log('[logWebsiteInfo] === INFORMAÇÕES DETALHADAS DO WEBSITE ===');
  console.log('[logWebsiteInfo] URL completa:', info.fullUrl);
  console.log('[logWebsiteInfo] URL limpa:', info.cleanUrl);
  console.log('[logWebsiteInfo] Hostname original:', hostname);
  console.log('[logWebsiteInfo] Hostname limpo (para busca):', cleanHostname);
  console.log('[logWebsiteInfo] Variações do hostname:', variations);
  console.log('[logWebsiteInfo] Protocolo:', info.protocol);
  console.log('[logWebsiteInfo] User Agent:', window.navigator.userAgent);
  console.log('[logWebsiteInfo] Referrer:', document.referrer);
  console.log('[logWebsiteInfo] ================================================');
} 