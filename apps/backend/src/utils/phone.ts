/**
 * Utilitário de sanitização de número telefônico para adequação ao princípio
 * de minimização e qualidade de dados da LGPD (Art. 6º, III e V).
 *
 * Remove formatações cosméticas (parênteses, espaços, hífens),
 * mantendo o '+' inicial caso seja fornecido padrão internacional (E.164).
 */
export function sanitizePhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return hasPlus ? `+${digits}` : digits;
}
