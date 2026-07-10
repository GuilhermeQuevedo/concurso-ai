// Converte HTML de questões/textos importados em texto limpo,
// preservando quebras de parágrafo e linha. Idempotente.
export function htmlToPlainText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|tr)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function hasHtml(input: string): boolean {
  return /<[a-z/][^>]*>|&nbsp;|&amp;|&lt;|&gt;|&quot;/i.test(input);
}
