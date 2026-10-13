export const DOCUMENT_KINDS = [
  'EDITAL',
  'EMENTA',
  'CRONOGRAMA',
  'MATERIAL',
  'LISTA_QUESTOES',
  'OUTRO',
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const SIGNALS: Record<Exclude<DocumentKind, 'OUTRO'>, RegExp[]> = {
  EDITAL: [
    /\bedital\b/i,
    /concurso\s+p[úu]blico/i,
    /processo\s+seletivo/i,
    /\bvagas?\b/i,
    /\binscri[çc][õo]es\b/i,
    /\bbanca\b/i,
    /\bremunera[çc][ãa]o\b/i,
    /\bcargo\b/i,
  ],
  EMENTA: [
    /\bementa\b/i,
    /plano\s+de\s+ensino/i,
    /\bbibliografia\b/i,
    /carga\s+hor[áa]ria/i,
    /unidade\s+curricular/i,
    /\bdisciplina\b/i,
    /objetivos\s+de\s+aprendizagem/i,
  ],
  CRONOGRAMA: [
    /\bcronograma\b/i,
    /\bcalend[áa]rio\b/i,
    /semana\s*\d+/i,
    /\bsegunda\b.*\bter[çc]a\b/i,
    /\d{1,2}\s*[/-]\s*\d{1,2}/,
  ],
  LISTA_QUESTOES: [
    /\bgabarito\b/i,
    /\balternativas?\b/i,
    /quest[ãa]o\s*\d+/i,
    /\(\s*[a-eA-E]\s*\)/,
    /\bresposta\s+correta\b/i,
  ],
  MATERIAL: [/\bresumo\b/i, /\bap[oó]stila\b/i, /\bcap[íi]tulo\b/i, /\bconceito\b/i, /\bintrodu[çc][ãa]o\b/i],
};

export function detectDocumentKind(text: string): DocumentKind {
  const sample = text.slice(0, 6000);
  let best: DocumentKind = 'OUTRO';
  let bestScore = 0;

  for (const kind of Object.keys(SIGNALS) as Exclude<DocumentKind, 'OUTRO'>[]) {
    const score = SIGNALS[kind].reduce((acc, re) => acc + (re.test(sample) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = kind;
    }
  }

  return bestScore >= 2 ? best : 'OUTRO';
}
