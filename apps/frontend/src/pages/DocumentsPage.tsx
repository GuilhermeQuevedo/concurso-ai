import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Loader2, FileUp, Trophy, Sparkles } from 'lucide-react';
import { rankingService } from '@/features/rankings/services/ranking.service';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  documentService,
  type DocumentDTO,
  type DocumentKind,
  type UploadedDocumentDTO,
  type ProcessResult,
  KIND_LABELS,
  KIND_OPTIONS,
} from '@/features/documents/services/document.service';

const ACTION_LABELS: Record<DocumentKind, string> = {
  EDITAL: 'Criar objetivo',
  EMENTA: 'Criar objetivo',
  CRONOGRAMA: 'Criar objetivo',
  MATERIAL: 'Gerar kit de estudo',
  LISTA_QUESTOES: 'Importar questões',
  OUTRO: 'Gerar kit de estudo',
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadKind, setUploadKind] = useState<DocumentKind | ''>('');
  const [lastUpload, setLastUpload] = useState<UploadedDocumentDTO | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', subjectFilter],
    queryFn: () => documentService.list(subjectFilter || undefined),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentService.upload(file, {
        subjectId: uploadSubject || undefined,
        kind: uploadKind || undefined,
      }),
    onSuccess: (uploaded) => {
      setLastUpload(uploaded);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const changeKindMutation = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: DocumentKind }) =>
      documentService.updateKind(id, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const [suggestedDocId, setSuggestedDocId] = useState<string | null>(null);
  const suggestRankingMutation = useMutation({
    mutationFn: (doc: DocumentDTO) =>
      rankingService.suggest({ documentId: doc.id, title: doc.name }),
    onSuccess: (_data, doc) => setSuggestedDocId(doc.id),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const processMutation = useMutation({
    mutationFn: (doc: DocumentDTO) => documentService.process(doc.id),
    onMutate: (doc) => {
      setProcessingId(doc.id);
      setProcessResult(null);
    },
    onSuccess: (result) => {
      setProcessResult(result);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onSettled: () => setProcessingId(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const flatSubjects = flattenSubjects(subjects);

  const typeIcons: Record<string, string> = {
    PDF: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    TXT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    MARKDOWN: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    HTML: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Importe materiais de estudo para gerar questões contextualizadas
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Enviar documento</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              O que é este arquivo?
            </label>
            <select
              value={uploadKind}
              onChange={(e) => setUploadKind(e.target.value as DocumentKind | '')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Detectar automaticamente</option>
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Disciplina (opcional)
            </label>
            <select
              value={uploadSubject}
              onChange={(e) => setUploadSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Sem disciplina</option>
              {flatSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prefix}{s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.html"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadMutation.isPending ? 'Enviando...' : 'Enviar arquivo'}
            </button>
          </div>
        </div>
        {uploadMutation.isError && (
          <p className="mt-2 text-sm text-red-500">Erro ao enviar arquivo. Verifique o formato (PDF, TXT, MD, HTML) e tamanho (máx 10MB).</p>
        )}
        {uploadMutation.isSuccess && lastUpload && (
          <p className="mt-2 text-sm text-green-600">
            Documento enviado! Identificado como <strong>{KIND_LABELS[lastUpload.kind]}</strong>
            {lastUpload.kindAutoDetected ? ' (detectado automaticamente — ajuste abaixo se precisar).' : '.'}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">Formatos: PDF, TXT, Markdown, HTML. Máximo 10MB.</p>
      </div>

      {processMutation.isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">
          Não foi possível processar o documento. Verifique se ele tem texto suficiente e tente de novo.
        </p>
      )}
      {processResult && (
        <div className="mb-4 rounded-xl border border-primary-300 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
          {processResult.pipeline === 'objetivo' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Objetivo <strong>{processResult.title}</strong> criado com o conteúdo programático.
              </p>
              <button
                onClick={() => navigate('/contests')}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              >
                Ver em Meus Objetivos
              </button>
            </div>
          )}
          {processResult.pipeline === 'kit' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Kit gerado: {processResult.summary ? 'resumo, ' : ''}
                {processResult.flashcards} flashcards e {processResult.questions} questões.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/flashcards')}
                  className="rounded-lg border border-primary-400 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/40"
                >
                  Flashcards
                </button>
                <button
                  onClick={() => navigate('/generate')}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  Praticar questões
                </button>
              </div>
            </div>
          )}
          {processResult.pipeline === 'questoes' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {processResult.imported} questões importadas da lista.
              </p>
              <button
                onClick={() => navigate('/generate')}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              >
                Praticar agora
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Seus documentos ({documents.length})
        </h2>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Todas disciplinas</option>
          {flatSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.prefix}{s.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileUp className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum documento importado ainda
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: DocumentDTO) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeIcons[doc.type] ?? typeIcons.TXT}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.type} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => processMutation.mutate(doc)}
                  disabled={processingId !== null}
                  title="Processar este documento conforme o tipo"
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {processingId === doc.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> {ACTION_LABELS[doc.kind ?? 'OUTRO']}
                    </>
                  )}
                </button>
                {suggestedDocId === doc.id ? (
                  <span className="text-xs font-medium text-green-600">Sugerido ao admin ✓</span>
                ) : (
                  <button
                    onClick={() => suggestRankingMutation.mutate(doc)}
                    disabled={suggestRankingMutation.isPending}
                    title="Sugerir um ranking global a partir deste documento"
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-primary-950/30"
                  >
                    <Trophy className="h-3.5 w-3.5" /> Sugerir ranking
                  </button>
                )}
                <select
                  value={doc.kind ?? 'OUTRO'}
                  onChange={(e) =>
                    changeKindMutation.mutate({ id: doc.id, kind: e.target.value as DocumentKind })
                  }
                  disabled={changeKindMutation.isPending}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {KIND_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function flattenSubjects(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const result: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    result.push({ ...s, prefix });
    if (s.children && s.children.length > 0) {
      result.push(...flattenSubjects(s.children, prefix + '— '));
    }
  }
  return result;
}
