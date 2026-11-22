import { htmlToPlainText } from './html.js';
import { areaOf, positionOf, type Area } from './question-area.js';

export interface NapAlternative {
  letra: string;
  texto: string;
}

export interface NapQuestion {
  id: string;
  ano: number | null;
  banca: string | null;
  orgao: string | null;
  prova: string | null;
  disciplina: string | null;
  tipo: string | null;
  alternativas: NapAlternative[] | null;
  gabarito: string | null;
  texto_principal_rich: string | null;
  texto_apoio_rich: string | null;
  dificuldade: string | null;
  comentario_rich: string | null;
  visivel: boolean;
}

export type BankDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface BankQuestionData {
  sourceRef: string;
  board: string;
  subject: string;
  statement: string;
  alternatives: Array<{ letter: string; text: string }>;
  correctAnswer: string;
  difficulty: BankDifficulty;
  explanation: string;
  examYear: number;
  organ: string | null;
  examName: string | null;
  position: string | null;
  area: Area;
}

const MAX_FIELD = 190;

export function mapDifficulty(value: string | null): BankDifficulty {
  const lower = (value ?? '').toLowerCase();
  if (lower.includes('difícil') || lower.includes('dificil')) return 'HARD';
  if (lower.includes('fácil') || lower.includes('facil')) return 'EASY';
  return 'MEDIUM';
}

export function normalizeBoardName(name: string): string {
  return name.replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim();
}

// Certo/Errado vem como "CERTO", "Errado" ou "C"/"E"; as demais vêm como a letra da alternativa.
export function normalizeAnswer(answer: string | null): string | null {
  const value = (answer ?? '').trim().toUpperCase();
  if (value === 'CERTO') return 'C';
  if (value === 'ERRADO') return 'E';
  return /^[A-E]$/.test(value) ? value : null;
}

const clip = (text: string | null): string | null => {
  const value = (text ?? '').trim();
  return value ? value.slice(0, MAX_FIELD) : null;
};

// Devolve a questão pronta para o banco, ou null quando ela não serve (oculta, sem alternativas, sem gabarito...).
export function toBankQuestion(raw: NapQuestion): BankQuestionData | null {
  if (!raw.visivel || !raw.banca?.trim() || !raw.disciplina?.trim() || !raw.ano) return null;
  const answer = normalizeAnswer(raw.gabarito);
  const alternatives = (raw.alternativas ?? [])
    .map((a) => ({ letter: a.letra.trim().toUpperCase(), text: htmlToPlainText(a.texto) }))
    .filter((a) => a.letter && a.text);
  if (!answer || alternatives.length < 2 || !alternatives.some((a) => a.letter === answer)) return null;

  const statement = htmlToPlainText([raw.texto_apoio_rich, raw.texto_principal_rich].filter(Boolean).join('\n\n'));
  if (statement.length < 3) return null;

  const position = positionOf(raw.prova, raw.ano, raw.orgao);
  return {
    sourceRef: `nap:${raw.id}`,
    board: normalizeBoardName(raw.banca).slice(0, MAX_FIELD),
    subject: raw.disciplina.trim().slice(0, MAX_FIELD),
    statement,
    alternatives,
    correctAnswer: answer,
    difficulty: mapDifficulty(raw.dificuldade),
    explanation: htmlToPlainText(raw.comentario_rich ?? ''),
    examYear: raw.ano,
    organ: clip(raw.orgao),
    examName: clip(raw.prova),
    position: clip(position),
    area: areaOf(position, raw.disciplina),
  };
}
