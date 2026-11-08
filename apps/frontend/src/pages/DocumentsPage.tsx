import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Building2, FileSearch, FileUp, Layers, Loader2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { contentService } from '@/features/content/services/content.service';
import { DocumentGroupSection } from '@/features/documents/components/DocumentGroupSection';
import { DocumentRow } from '@/features/documents/components/DocumentRow';
import { DocumentToolbar } from '@/features/documents/components/DocumentToolbar';
import { DocumentUploadCard } from '@/features/documents/components/DocumentUploadCard';
import { ProcessResultBanner } from '@/features/documents/components/ProcessResultBanner';
import { useDocumentActions } from '@/features/documents/hooks/useDocumentActions';
import { documentService, type DocumentDTO, type DocumentKind } from '@/features/documents/services/document.service';
import { flattenSubjects } from '@/features/documents/utils/flatten-subjects';
import {
  countByKind,
  filterDocuments,
  groupDocuments,
  sortDocuments,
  type DocumentFilters,
  type GroupBy,
  type SortBy,
} from '@/features/documents/utils/group-documents';

const ACTION_LABELS: Partial<Record<DocumentKind, string>> = {
  EDITAL: 'Criar edital',
  EMENTA: 'Criar edital',
  CRONOGRAMA: 'Criar edital',
  LISTA_QUESTOES: 'Importar questões',
};

const GROUP_BY_STORAGE_KEY = 'engrama:documents:groupBy';
const EMPTY_FILTERS: DocumentFilters = { query: '', kind: 'TODOS', subjectId: '' };

function readStoredGroupBy(): GroupBy {
  try {
    return localStorage.getItem(GROUP_BY_STORAGE_KEY) === 'disciplina' ? 'disciplina' : 'tipo';
  } catch {
    return 'tipo';
  }
}

export function DocumentsPage() {
  const [filters, setFilters] = useState<DocumentFilters>(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>(readStoredGroupBy);
  const [sortBy, setSortBy] = useState<SortBy>('recentes');
  const [deleteTarget, setDeleteTarget] = useState<DocumentDTO | null>(null);
  const actions = useDocumentActions();

  const { data: subjectTree = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: documents = [], isLoading } = useQuery({ queryKey: ['documents', 'all'], queryFn: () => documentService.list() });

  const subjects = useMemo(() => flattenSubjects(subjectTree), [subjectTree]);
  const subjectNames = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const subjectName = (id: string) => subjectNames.get(id) ?? 'Disciplina removida';

  const visible = useMemo(() => sortDocuments(filterDocuments(documents, filters), sortBy), [documents, filters, sortBy]);
  const groups = useMemo(() => groupDocuments(visible, groupBy, (id) => subjectNames.get(id) ?? 'Disciplina removida'), [visible, groupBy, subjectNames]);
  const counts = useMemo(() => countByKind(documents), [documents]);
  const filtering = filters.query !== '' || filters.kind !== 'TODOS' || filters.subjectId !== '';

  const changeGroupBy = (next: GroupBy) => {
    setGroupBy(next);
    try {
      localStorage.setItem(GROUP_BY_STORAGE_KEY, next);
    } catch {
      // o agrupamento só deixa de ser lembrado
    }
  };

  const renderRow = (doc: DocumentDTO) => (
    <DocumentRow
      doc={doc}
      subjectName={doc.subjectId ? subjectName(doc.subjectId) : null}
      actionLabel={ACTION_LABELS[doc.kind ?? 'OUTRO']}
      isProcessing={actions.processingId === doc.id}
      processDisabled={actions.processingId !== null}
      suggested={actions.suggestedIds.has(doc.id)}
      suggestDisabled={actions.suggest.isPending}
      onProcess={() => actions.process.mutate(doc)}
      onChangeKind={(kind) => actions.changeKind.mutate({ id: doc.id, kind })}
      onSuggest={() => actions.suggest.mutate(doc)}
      onDelete={() => setDeleteTarget(doc)}
    />
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Importe materiais de estudo para gerar questões contextualizadas</p>
        </div>
        <div className="flex gap-2">
          <ShortcutLink to="/subjects" icon={Layers} label="Disciplinas" />
          <ShortcutLink to="/exam-boards" icon={Building2} label="Bancas" />
        </div>
      </div>

      <DocumentUploadCard subjects={subjects} />
      {actions.processResult && <ProcessResultBanner result={actions.processResult} onDismiss={actions.dismissResult} />}

      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Seus documentos ({documents.length})</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileUp className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum documento importado ainda</p>
        </div>
      ) : (
        <>
          <DocumentToolbar
            filters={filters}
            counts={counts}
            subjects={subjects.map((s) => ({ id: s.id, label: `${s.prefix}${s.name}` }))}
            groupBy={groupBy}
            sortBy={sortBy}
            onFilters={setFilters}
            onGroupBy={changeGroupBy}
            onSortBy={setSortBy}
          />
          {visible.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <FileSearch className="mx-auto mb-3 h-9 w-9 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum documento encontrado com esses filtros.</p>
              {filtering && (
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-500">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <DocumentGroupSection
                key={`${groupBy}-${group.key}`}
                label={group.label}
                documents={group.documents}
                showAll={filters.query !== ''}
                renderRow={renderRow}
              />
            ))
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Apagar documento?"
          message={
            <>
              Você vai apagar <strong className="text-gray-900 dark:text-white">{deleteTarget.name}</strong>. Essa ação não pode ser desfeita.
            </>
          }
          isPending={actions.remove.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => actions.remove.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  );
}

function ShortcutLink({ to, icon: Icon, label }: { to: string; icon: typeof Layers; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:text-gray-300"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
