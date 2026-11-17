import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { AnalysisModal } from '@/features/documents/components/AnalysisModal';
import { DocumentNameInput } from '@/features/documents/components/DocumentNameInput';
import { useProcessDocument } from '@/features/documents/hooks/useProcessDocument';
import {
  documentService,
  KIND_LABELS,
  type DocumentKind,
  type ReadingInfoDTO,
  type UploadedDocumentDTO,
} from '@/features/documents/services/document.service';
import { invalidateAfterContestCreated } from '@/lib/query-invalidation';
import { getErrorMessage } from '@/utils/error-message';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OBJETIVO_KINDS: DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA'];
const UPLOAD_KINDS: DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA', 'LISTA_QUESTOES'];
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/html', 'text/markdown', ''];

const KIND_INFO: Partial<Record<DocumentKind, string>> = {
  EDITAL: 'A IA lê o edital e extrai órgão, banca, cargo, data da prova e o conteúdo programático como checklist.',
  EMENTA: 'A IA lê a ementa/plano de ensino e monta seu checklist de estudo com as disciplinas e tópicos.',
  CRONOGRAMA: 'A IA lê o cronograma e monta seu objetivo de estudo com os tópicos e a contagem regressiva.',
  LISTA_QUESTOES: 'A IA extrai as questões prontas do arquivo e importa para o seu banco de questões.',
};

const KIND_ACTION: Partial<Record<DocumentKind, string>> = {
  EDITAL: 'Analisar e Criar Objetivo',
  EMENTA: 'Analisar e Criar Objetivo',
  CRONOGRAMA: 'Analisar e Criar Objetivo',
  LISTA_QUESTOES: 'Importar Questões',
};

const number = (value: number) => value.toLocaleString('pt-BR');

function ReadingCard({ file, reading, onRemove }: { file: File; reading: ReadingInfoDTO; onRemove: () => void }) {
  const size = reading.pageCount !== null ? `${reading.pageCount} páginas · ` : '';
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {size}
            {number(reading.characters)} caracteres · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button type="button" onClick={onRemove} aria-label="Remover arquivo" className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      {reading.inParts && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {reading.pageCount !== null
            ? `Documento grande: lemos primeiro as ${reading.processedPages} de ${reading.pageCount} páginas e, em seguida, o restante é lido em segundo plano e somado ao mesmo edital.`
            : `Documento grande: lemos primeiro ${number(reading.processedChars)} de ${number(reading.characters)} caracteres e, em seguida, o restante é lido em segundo plano e somado ao mesmo edital.`}
        </p>
      )}
    </div>
  );
}

export function EditalUpload({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [kind, setKind] = useState<DocumentKind>('EDITAL');
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<UploadedDocumentDTO | null>(null);
  const [focus, setFocus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processing = useProcessDocument();

  const isObjetivo = OBJETIVO_KINDS.includes(kind);

  const upload = useMutation({
    mutationFn: (selected: File) => documentService.upload(selected, { kind, name: docName || selected.name }),
    onSuccess: (document, selected) => {
      setUploaded(document);
      setDocName((current) => current || selected.name.replace(/\.[a-z0-9]+$/i, ''));
    },
    onError: (error) => {
      setFile(null);
      setFileError(getErrorMessage(error, 'Não foi possível ler o arquivo. Verifique se ele tem texto e tente de novo.'));
    },
  });

  const discard = () => {
    if (uploaded) void documentService.delete(uploaded.id).catch(() => undefined);
    setFile(null);
    setUploaded(null);
  };

  const handleFiles = (files: FileList | null) => {
    setFileError('');
    if (!files || files.length === 0) return;
    const selected = files[0];
    const okExt = /\.(pdf|txt|md|html?)$/i.test(selected.name);
    if (!ALLOWED_TYPES.includes(selected.type) && !okExt) return setFileError('Formatos aceitos: PDF, TXT, Markdown, HTML.');
    if (selected.size > MAX_FILE_SIZE) return setFileError('Arquivo muito grande. Tamanho máximo: 10MB.');
    setFile(selected);
    upload.mutate(selected);
  };

  const analyze = async () => {
    if (!uploaded) return;
    try {
      if (docName.trim() && docName.trim() !== uploaded.name) await documentService.rename(uploaded.id, docName.trim());
      if (kind !== uploaded.kind) await documentService.updateKind(uploaded.id, kind);
    } catch (error) {
      return setFileError(getErrorMessage(error, 'Não foi possível salvar o nome do documento.'));
    }

    const job = await processing.run(uploaded.id, isObjetivo ? focus || undefined : undefined);
    if (!job?.result) return;
    void invalidateAfterContestCreated(queryClient);
    if (job.status === 'RUNNING') toast.success('Edital criado com as primeiras páginas. Estamos lendo o restante e somando aqui.');
    if (job.result.pipeline === 'objetivo') onCreated(job.result.contestId);
    else navigate('/generate');
  };

  const busy = upload.isPending || processing.running;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">O que é este arquivo?</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as DocumentKind)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {UPLOAD_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{KIND_INFO[kind] ?? ''}</p>
      </div>

      {isObjetivo && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-300">Envie o conteúdo programático</p>
          <p>
            O ideal é enviar <strong className="text-white">apenas o conteúdo programático</strong> (a lista de matérias e tópicos), não o edital inteiro.
            Editais grandes? Lemos as primeiras 50 páginas primeiro e o restante em seguida, somando ao mesmo edital.
          </p>
        </div>
      )}

      {isObjetivo && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Qual o seu foco? <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ex: Professor de Sociologia, Analista Judiciário, Área de TI..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Informe o cargo ou área que vai prestar. A IA monta o cronograma só com as disciplinas exigidas para o seu foco.
          </p>
        </div>
      )}

      <DocumentNameInput value={docName} onChange={setDocName} showError={Boolean(file) && !docName.trim()} />

      {file && uploaded ? (
        <ReadingCard file={file} reading={uploaded.reading} onRemove={discard} />
      ) : file ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" /> Lendo o arquivo...
        </div>
      ) : (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`mb-2 h-8 w-8 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Arraste o arquivo aqui ou clique para selecionar</p>
          <p className="mt-1 text-xs text-gray-500">PDF, TXT, Markdown ou HTML · Máximo 10MB</p>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.html" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}

      {fileError && <p className="text-xs text-red-500">{fileError}</p>}

      <button
        type="button"
        onClick={() => void analyze()}
        disabled={!uploaded || !docName.trim() || busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {processing.running ? 'Analisando com IA...' : 'Lendo o arquivo...'}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> {KIND_ACTION[kind] ?? 'Enviar'}
          </>
        )}
      </button>

      <AnalysisModal
        open={processing.running}
        error={processing.error}
        inParts={Boolean(uploaded?.reading.inParts)}
        firstPages={uploaded?.reading.processedPages ?? null}
        onCancel={processing.cancel}
        onClose={processing.clearError}
      />
    </div>
  );
}
