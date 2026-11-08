import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Loader2, Trash2 } from 'lucide-react';

import { KIND_LABELS, documentService } from '@/features/documents/services/document.service';

export interface DeleteContestOptions {
  deleteEdital: boolean;
  documentIds: string[];
}

export interface DeleteContestDialogProps {
  contestName: string;
  editalDocumentId: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (options: DeleteContestOptions) => void;
}

// Confirmação antes de apagar uma prova: o usuário escolhe quais documentos saem junto.
export function DeleteContestDialog({ contestName, editalDocumentId, isDeleting, onCancel, onConfirm }: DeleteContestDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [deleteEdital, setDeleteEdital] = useState(true);
  const [showOthers, setShowOthers] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: documents = [], isLoading } = useQuery({ queryKey: ['documents', 'all'], queryFn: () => documentService.list() });

  const editalDocument = useMemo(() => documents.find((d) => d.id === editalDocumentId) ?? null, [documents, editalDocumentId]);
  const others = useMemo(() => documents.filter((d) => d.id !== editalDocumentId), [documents, editalDocumentId]);
  const totalDocuments = (editalDocument && deleteEdital ? 1 : 0) + selected.size;

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDeleting, onCancel]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = () => onConfirm({ deleteEdital: deleteEdital && Boolean(editalDocument), documentIds: [...selected] });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-contest-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-contest-title" className="text-lg font-bold text-gray-900 dark:text-white">
          Tem certeza que deseja apagar?
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Você vai apagar <strong className="text-gray-900 dark:text-white">{contestName}</strong>, com o checklist, as revisões
          agendadas e as tarefas do calendário. Essa ação não pode ser desfeita.
        </p>

        <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Documentos</p>
          {isLoading ? (
            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : editalDocument ? (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={deleteEdital}
                onChange={(e) => setDeleteEdital(e.target.checked)}
                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span>
                Apagar também o documento do edital: <strong>{editalDocument.name}</strong>
              </span>
            </label>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta prova não tem documento de edital vinculado.</p>
          )}

          {others.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showOthers ? 'rotate-180' : ''}`} />
                Apagar outros documentos junto ({others.length})
              </button>
              {showOthers && (
                <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                  {others.map((doc) => (
                    <li key={doc.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={selected.has(doc.id)}
                          onChange={() => toggle(doc.id)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{doc.name}</span>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{KIND_LABELS[doc.kind]}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {totalDocuments === 0 ? 'Nenhum documento será apagado.' : `${totalDocuments} documento${totalDocuments > 1 ? 's' : ''} será${totalDocuments > 1 ? 'ão' : ''} apagado${totalDocuments > 1 ? 's' : ''}.`}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}
