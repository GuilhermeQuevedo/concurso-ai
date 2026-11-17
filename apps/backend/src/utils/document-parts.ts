// Edital grande é lido em partes: as primeiras páginas primeiro, o restante em seguida e somado ao mesmo edital.
export const MAX_FIRST_PART_PAGES = 50;
export const MAX_FIRST_PART_CHARS = 90_000;

export interface PdfPartInfo {
  content: string;
  pageCount: number;
  // Onde termina a primeira parte dentro de `content`; null quando o documento cabe inteiro na primeira leitura.
  firstPartChars: number | null;
}

const PAGE_SEPARATOR = '\n\n';

export function splitPdfPages(pageTexts: readonly string[]): PdfPartInfo {
  const pages = pageTexts.map((text) => text.trim());
  const content = pages.filter(Boolean).join(PAGE_SEPARATOR);
  if (pages.length <= MAX_FIRST_PART_PAGES) return { content, pageCount: pages.length, firstPartChars: null };

  const first = pages.slice(0, MAX_FIRST_PART_PAGES).filter(Boolean).join(PAGE_SEPARATOR);
  const hasRest = content.length > first.length;
  return { content, pageCount: pages.length, firstPartChars: hasRest ? first.length : null };
}

// Texto sem páginas (TXT, HTML, Markdown): corta perto do limite, no último parágrafo inteiro.
export function splitPlainText(content: string, maxChars = MAX_FIRST_PART_CHARS): number | null {
  if (content.length <= maxChars) return null;
  const cut = content.lastIndexOf('\n\n', maxChars);
  return cut > maxChars / 2 ? cut : maxChars;
}

export interface DocumentParts {
  first: string;
  rest: string;
}

export function partsOf(content: string, firstPartChars: number | null): DocumentParts {
  if (firstPartChars === null || firstPartChars >= content.length) return { first: content, rest: '' };
  return { first: content.slice(0, firstPartChars).trim(), rest: content.slice(firstPartChars).trim() };
}
