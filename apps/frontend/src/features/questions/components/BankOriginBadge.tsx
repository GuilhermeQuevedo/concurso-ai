import { Landmark } from 'lucide-react';
import type { QuestionDTO } from '../services/question.service';

interface BankOriginBadgeProps {
  question: QuestionDTO;
}

/**
 * Astryx Badge destacando a procedência oficial de questões extraídas diretamente de bancas de concurso.
 * Adere à paleta Verde-Revisão (#2E8C82) e tipografia padronizada.
 */
export function BankOriginBadge({ question }: BankOriginBadgeProps) {
  if (question.source !== 'BANK') return null;

  const originDetails = [
    question.examBoard?.name,
    question.examYear,
    question.organ,
    question.position,
  ].filter(Boolean);

  return (
    <div
      role="note"
      aria-label="Questão oficial de concurso público"
      className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-3 py-1 text-xs font-semibold text-[#1b5e56] shadow-2xs dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]"
    >
      <Landmark className="h-3.5 w-3.5 shrink-0 text-[#2E8C82] dark:text-[#52b3a8]" aria-hidden="true" />
      <span>
        Questão de banca
        {originDetails.length > 0 && ` · ${originDetails.join(' · ')}`}
      </span>
    </div>
  );
}
