import { FileText, Loader2, Sparkles } from 'lucide-react';

import type { DocumentDTO, DocumentKind } from '../services/document.service';
import { DocumentMenu } from './DocumentMenu';
import { EditableDocumentName } from './EditableDocumentName';

export interface DocumentRowProps {
  doc: DocumentDTO;
  subjectName: string | null;
  actionLabel?: string;
  isProcessing: boolean;
  processDisabled: boolean;
  suggested: boolean;
  suggestDisabled: boolean;
  onProcess: () => void;
  onChangeKind: (kind: DocumentKind) => void;
  onSuggest: () => void;
  onDelete: () => void;
}

const TYPE_STYLES: Record<string, string> = {
  PDF: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  TXT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  MARKDOWN: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  HTML: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
};

export function DocumentRow({
  doc,
  subjectName,
  actionLabel,
  isProcessing,
  processDisabled,
  suggested,
  suggestDisabled,
  onProcess,
  onChangeKind,
  onSuggest,
  onDelete,
}: DocumentRowProps) {
  const meta = [doc.type, new Date(doc.createdAt).toLocaleDateString('pt-BR'), subjectName].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_STYLES[doc.type] ?? TYPE_STYLES.TXT}`}>
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <EditableDocumentName id={doc.id} name={doc.name} />
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actionLabel && (
          <button
            type="button"
            onClick={onProcess}
            disabled={processDisabled}
            title="Processar este documento conforme o tipo"
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> {actionLabel}
              </>
            )}
          </button>
        )}
        <DocumentMenu
          documentName={doc.name}
          kind={doc.kind ?? 'OUTRO'}
          suggested={suggested}
          suggestDisabled={suggestDisabled}
          onChangeKind={onChangeKind}
          onSuggest={onSuggest}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
