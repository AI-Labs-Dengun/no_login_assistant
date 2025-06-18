// Função padronizada para obter o website
export function getWebsiteUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // Sempre retorna com protocolo https e barra final
  let origin = window.location.origin;
  if (!origin.startsWith('https://')) {
    origin = origin.replace(/^http:\/\//, 'https://');
  }
  if (!origin.endsWith('/')) {
    origin += '/';
  }
  
  return origin;
}

// Função para obter website limpo (sem protocolo nem barra final)
export function getCleanWebsite(): string {
  if (typeof window === 'undefined') return '';
  
  let origin = window.location.origin;
  // Remove protocolo
  origin = origin.replace(/^https?:\/\//, '');
  // Remove barra final, se houver
  if (origin.endsWith('/')) {
    origin = origin.slice(0, -1);
  }
  
  return origin;
} 