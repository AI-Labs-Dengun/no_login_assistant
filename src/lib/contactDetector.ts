// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar telefone (formato brasileiro)
export function isValidPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  // Verifica se tem entre 8 e 11 dígitos
  return cleanPhone.length >= 8 && cleanPhone.length <= 11;
}

// Função para extrair email da mensagem
export function extractEmail(message: string): string | null {
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  const match = message.match(emailRegex);
  return match && isValidEmail(match[0]) ? match[0] : null;
}

// Função para extrair telefone da mensagem
export function extractPhone(message: string): string | null {
  // Padrão mais flexível para capturar números de telefone
  const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(\d{2})?[-. )]*(\d{4,5})[-. ]*(\d{4})/;
  const match = message.match(phoneRegex);
  
  if (match) {
    // Remove todos os caracteres não numéricos e junta os grupos
    const cleanPhone = match.slice(1).filter(Boolean).join('');
    return isValidPhone(cleanPhone) ? cleanPhone : null;
  }
  
  return null;
}

// Função para detectar informações de contato na mensagem
export function detectContactInfo(message: string): { email: string | null; phone: string | null } {
  return {
    email: extractEmail(message),
    phone: extractPhone(message),
  };
} 