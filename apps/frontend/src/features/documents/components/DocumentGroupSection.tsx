import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import type { DocumentDTO } from '../services/document.service';

const PREVIEW_LIMIT = 8;

export interface DocumentGroupSectionProps {
  label: string;
  documents: DocumentDTO[];
  // Com um único grupo (ou busca ativa) mostra tudo aberto e sem corte.
  showAll?: boolean;
  renderRow: (doc: DocumentDTO) => ReactNode;
}

// Setor da lista: cabeçalho recolhível com a contagem e, se for grande, "Mostrar todos".
export function DocumentGroupSection({ label, documents, showAll = false, renderRow }: DocumentGroupSectionProps) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const limited = !showAll && !expanded && documents.length > PREVIEW_LIMIT;
  const visible = limited ? documents.slice(0, PREVIEW_LIMIT) : documents;

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center gap-2 text-left"
      >
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {documents.length}
        </span>
      </button>
      {open && (
        <div className="space-y-2">
          {visible.map((doc) => (
            <div key={doc.id}>{renderRow(doc)}</div>
          ))}
          {limited && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:border-gray-700 dark:hover:bg-primary-950/30"
            >
              Mostrar todos ({documents.length})
            </button>
          )}
        </div>
      )}
    </section>
  );
}
