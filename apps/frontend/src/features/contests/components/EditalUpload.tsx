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
const OBJETIVO_KINDS: readonly DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA'];
const UPLOAD_KINDS: readonly DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA', 'LISTA_QUESTOES'];
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/html', 'text/markdown', ''];

const KIND_INFO: Partial<Record<DocumentKind, string>> = {
  EDITAL: 'A IA analisa o edital e extrai órgão, banca, cargo, data da prova e conteúdo programático organizado em tópicos.',
  EMENTA: 'A IA lê a ementa/plano de ensino e monta o checklist de estudo com matérias e subtópicos.',
  CRONOGRAMA: 'A IA lê o cronograma e estrutura o objetivo de estudo com contagem regressiva.',
  LISTA_QUESTOES: 'A IA extrai questões prontas do documento e importa para o seu banco de questões.',
};

const KIND_ACTION: Partial<Record<DocumentKind, string>> = {
  EDITAL: 'Analisar e Criar Objetivo',
  EMENTA: 'Analisar e Criar Objetivo',
  CRONOGRAMA: 'Analisar e Criar Objetivo',
  LISTA_QUESTOES: 'Importar Questões',
};

const number = (value: number) => value.toLocaleString('pt-BR');

function ReadingCard({
  file,
  reading,
  onRemove,
}: {
  file: File;
  reading: ReadingInfoDTO;
  onRemove: () => void;
}) {
  const size = reading.pageCount !== null ? `${reading.pageCount} páginas · ` : '';
  return (
    <div className="rounded-2xl border border-[#2E8C82]/30 bg-[#2E8C82]/5 p-4 dark:border-[#2E8C82]/30 dark:bg-[#2E8C82]/10 transition-all duration-fast">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 shrink-0 text-[#2E8C82] dark:text-[#52b3a8]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {size}
            {number(reading.characters)} caracteres · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover arquivo"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {reading.inParts && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#F2A93B]/40 bg-[#F2A93B]/10 p-2.5 text-xs font-semibold text-[#8a5d1b] dark:border-[#F2A93B]/40 dark:bg-[#F2A93B]/15 dark:text-[#f8c16d]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F2A93B]" />
          <span>
            {reading.pageCount !== null
              ? `Documento extenso: processamos primeiro ${reading.processedPages} de ${reading.pageCount} páginas; o restante será analisado em segundo plano e somado a este mesmo edital.`
              : `Documento extenso: processamos primeiro ${number(reading.processedChars)} de ${number(reading.characters)} caracteres; o restante será analisado em segundo plano.`}
          </span>
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
      setFileError(getErrorMessage(error, 'Não foi possível ler o arquivo. Verifique se ele possui texto selecionável e tente novamente.'));
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
    if (!ALLOWED_TYPES.includes(selected.type) && !okExt) {
      return setFileError('Formatos aceitos: PDF, TXT, Markdown, HTML.');
    }
    if (selected.size > MAX_FILE_SIZE) {
      return setFileError('Arquivo muito grande. O limite máximo permitido é 10MB.');
    }
    setFile(selected);
    upload.mutate(selected);
  };

  const analyze = async () => {
    if (!uploaded) return;
    try {
      if (docName.trim() && docName.trim() !== uploaded.name) {
        await documentService.rename(uploaded.id, docName.trim());
      }
      if (kind !== uploaded.kind) {
        await documentService.updateKind(uploaded.id, kind);
      }
    } catch (error) {
      return setFileError(getErrorMessage(error, 'Não foi possível salvar os dados do documento.'));
    }

    const job = await processing.run(uploaded.id, isObjetivo ? focus || undefined : undefined);
    if (!job?.result) return;
    void invalidateAfterContestCreated(queryClient);
    if (job.status === 'RUNNING') {
      toast.success('Edital criado com as primeiras páginas. O restante está sendo lido em segundo plano.');
    }
    if (job.result.pipeline === 'objetivo') {
      onCreated(job.result.contestId);
    } else {
      navigate('/generate');
    }
  };

  const busy = upload.isPending || processing.running;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
          Tipo de documento
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as DocumentKind)}
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation"
        >
          {UPLOAD_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[#2E8C82]/30 bg-[#2E8C82]/5 p-3.5 text-sm text-[#1b5e56] dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/10 dark:text-[#52b3a8]">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2E8C82] dark:text-[#52b3a8]" />
        <p className="leading-snug">{KIND_INFO[kind] ?? ''}</p>
      </div>

      {isObjetivo && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#2E8C82] dark:text-[#52b3a8]">
            Dica para melhor precisão
          </p>
          <p className="leading-relaxed">
            Recomendamos enviar <strong className="text-slate-900 dark:text-white">apenas as páginas do conteúdo programático</strong> (matérias e tópicos) para acelerar a leitura.
          </p>
        </div>
      )}

      {isObjetivo && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            Cargo ou foco específico <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ex: Professor de Sociologia, Analista Judiciário, Área de TI..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A IA priorizará as disciplinas exigidas exclusivamente para o cargo informado.
          </p>
        </div>
      )}

      <DocumentNameInput value={docName} onChange={setDocName} showError={Boolean(file) && !docName.trim()} />

      {file && uploaded ? (
        <ReadingCard file={file} reading={uploaded.reading} onRemove={discard} />
      ) : file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E8C82]" />
          <span>Lendo e extraindo conteúdo do arquivo...</span>
        </div>
      ) : (
        <div
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-fast ${
            dragOver
              ? 'border-[#2E8C82] bg-[#2E8C82]/5 dark:border-[#2E8C82] dark:bg-[#2E8C82]/10'
              : 'border-slate-300 hover:border-[#2E8C82] dark:border-slate-700 dark:hover:border-[#2E8C82]'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`mb-2.5 h-8 w-8 transition-colors ${dragOver ? 'text-[#2E8C82]' : 'text-slate-400'}`} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Arraste seu edital aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, TXT, Markdown ou HTML · Limite de 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.html"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {fileError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-300">
          {fileError}
        </div>
      )}

      <button
        type="button"
        onClick={() => void analyze()}
        disabled={!uploaded || !docName.trim() || busy}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-fast hover:bg-[#26776f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99] touch-manipulation cursor-pointer"
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{processing.running ? 'Analisando com IA...' : 'Lendo o arquivo...'}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span>{KIND_ACTION[kind] ?? 'Enviar'}</span>
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
