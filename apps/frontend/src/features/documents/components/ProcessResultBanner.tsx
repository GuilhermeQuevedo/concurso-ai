import { useNavigate } from 'react-router';
import { X } from 'lucide-react';

import type { ProcessResult } from '../services/document.service';

export interface ProcessResultBannerProps {
  result: ProcessResult;
  onDismiss: () => void;
}

// Aviso de sucesso depois de processar um documento (edital vira prova, lista vira questões).
export function ProcessResultBanner({ result, onDismiss }: ProcessResultBannerProps) {
  const navigate = useNavigate();
  if (result.pipeline === 'kit') return null;
  const isContest = result.pipeline === 'objetivo';

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary-300 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
      <p className="text-sm text-gray-800 dark:text-gray-200">
        {result.pipeline === 'objetivo' ? (
          <>
            Edital <strong>{result.title}</strong> criado com o conteúdo programático.
          </>
        ) : (
          <>{result.imported} questões importadas da lista.</>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(isContest ? '/contests' : '/generate')}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          {isContest ? 'Ver em Meus Editais' : 'Praticar agora'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="rounded p-1 text-gray-500 hover:bg-primary-100 dark:hover:bg-primary-900/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
