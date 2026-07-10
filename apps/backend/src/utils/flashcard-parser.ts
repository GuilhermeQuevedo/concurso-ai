export interface ParsedCard {
  front: string;
  back: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  skipped: number;
}

const MAX_CARDS = 1000;
const MAX_FIELD_LENGTH = 2000;

const SEPARATOR_NAMES: Record<string, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  pipe: '|',
};

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Divide uma linha respeitando campos entre aspas (padrão CSV)
function splitLine(line: string, separator: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function detectSeparator(lines: string[]): string {
  const sample = lines.slice(0, 10);
  const counts = { '\t': 0, ';': 0, ',': 0 };
  for (const line of sample) {
    if (line.includes('\t')) counts['\t']++;
    if (line.includes(';')) counts[';']++;
    if (line.includes(',')) counts[',']++;
  }
  if (counts['\t'] > 0) return '\t';
  if (counts[';'] >= counts[',']) return ';';
  return ',';
}

function isHeaderRow(fields: string[]): boolean {
  const first = fields[0]?.toLowerCase().trim();
  const second = fields[1]?.toLowerCase().trim();
  const headerWords = ['front', 'back', 'frente', 'verso', 'pergunta', 'resposta', 'question', 'answer'];
  return headerWords.includes(first) && headerWords.includes(second);
}

export function parseFlashcardText(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/);
  let separator: string | null = null;
  let tagsColumn: number | null = null;
  const dataLines: string[] = [];
  let skipped = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Cabeçalhos do Anki: #separator:tab, #html:true, #tags column:3
    if (trimmed.startsWith('#')) {
      const sepMatch = trimmed.match(/^#separator:\s*(\S+)/i);
      if (sepMatch) separator = SEPARATOR_NAMES[sepMatch[1].toLowerCase()] ?? sepMatch[1];
      const tagsMatch = trimmed.match(/^#tags column:\s*(\d+)/i);
      if (tagsMatch) tagsColumn = Number(tagsMatch[1]);
      continue;
    }
    dataLines.push(line);
  }

  const sep = separator ?? detectSeparator(dataLines);
  const cards: ParsedCard[] = [];

  dataLines.forEach((line, index) => {
    if (cards.length >= MAX_CARDS) {
      skipped++;
      return;
    }

    const fields = splitLine(line, sep).map((f) => stripHtml(f));
    if (index === 0 && isHeaderRow(fields)) return;

    const front = fields[0]?.slice(0, MAX_FIELD_LENGTH);
    const back = fields
      .slice(1)
      // Coluna de tags do Anki não faz parte do verso (1-indexada)
      .filter((f, i) => f.length > 0 && (tagsColumn === null || i + 2 !== tagsColumn))
      .join(' — ')
      .slice(0, MAX_FIELD_LENGTH);

    if (front && back) {
      cards.push({ front, back });
    } else {
      skipped++;
    }
  });

  return { cards, skipped };
}
