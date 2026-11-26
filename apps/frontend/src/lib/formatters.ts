/**
 * Módulo de Formatadores e Normalizadores Tolerantes — Lei de Postel
 * "Seja tolerante no que aceita, estrito no que emite."
 */

/**
 * Remove caracteres invisíveis (zero-width spaces, BOM) e normaliza espaços em branco duplicados.
 */
export function cleanWhitespace(value: string): string {
  if (!value) return '';
  return value
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Normaliza e-mail colado ou digitado pelo usuário: minúsculas, sem espaços e sem artefatos invisíveis.
 */
export function normalizeEmail(value: string): string {
  if (!value) return '';
  return value
    .replace(/[\u200B-\u200D\uFEFF\s]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extrai estritamente os dígitos numéricos (0-9) de uma string.
 */
export function normalizeDigits(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formata CPF de forma progressiva e tolerante (máximo 11 dígitos).
 * Ex: "12345678901" -> "123.456.789-01"
 */
export function formatCpf(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata número de telefone brasileiro (10 ou 11 dígitos).
 * Ex: "11987654321" -> "(11) 98765-4321", "1133334444" -> "(11) 3333-4444"
 */
export function formatPhone(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Converte formatos comuns de data (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) para padrão estrito ISO YYYY-MM-DD.
 * Retorna null caso o formato seja inválido.
 */
export function normalizeDateToIso(value: string): string | null {
  const cleaned = cleanWhitespace(value);
  if (!cleaned) return null;

  // Formato ISO: YYYY-MM-DD
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(cleaned);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Formato BR: DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(cleaned);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Higieniza textos colados de PDFs, editais ou anotações (redações, questões).
 * Normaliza quebras de linha Windows (\r\n) para Unix (\n), remove quebras repetidas excessivas (> 2)
 * e limpa trailing spaces por linha.
 */
export function cleanPastedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
