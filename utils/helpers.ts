// Função segura para gerar IDs únicos (UUID v4 like)
// Funciona em contextos HTTP e navegadores antigos onde crypto.randomUUID não está disponível
export const generateSafeId = (): string => {
  // Tenta usar crypto nativo se disponível e seguro
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback se falhar
    }
  }

  // Fallback manual robusto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};