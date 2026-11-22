import { Landmark } from 'lucide-react';

import type { QuestionDTO } from '../services/question.service';

// Mostra de onde veio a questão quando ela é de banca (e não gerada por IA).
export function BankOriginBadge({ question }: { question: QuestionDTO }) {
  if (question.source !== 'BANK') return null;
  const parts = [question.examBoard?.name, question.examYear, question.organ, question.position].filter(Boolean);
  return (
    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
      <Landmark className="h-3.5 w-3.5" />
      Questão de banca{parts.length > 0 && ` · ${parts.join(' · ')}`}
    </div>
  );
}
