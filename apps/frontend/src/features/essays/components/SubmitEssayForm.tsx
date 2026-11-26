import { useState, useRef, useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Send, Loader2, ChevronLeft, FileText, Image, X, PenLine, ClipboardList, Shuffle } from 'lucide-react';
import { essayService, type EssayType } from '@/features/essays/services/essay.service';
import { pickRandomTheme, type EssayTheme } from '@/features/essays/data/essayThemes';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type AnswerMode = 'text' | 'file';

interface SubmitEssayFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export function SubmitEssayForm({ onBack, onCreated }: SubmitEssayFormProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const themeId = useId();
  const textAnswerId = useId();

  const [type, setType] = useState<EssayType>('DISSERTATIVA');
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [role, setRole] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [caseStatement, setCaseStatement] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [lineLimit, setLineLimit] = useState('');

  const [generated, setGenerated] = useState<EssayTheme | null>(null);

  const [answerMode, setAnswerMode] = useState<AnswerMode>('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCase = type === 'ESTUDO_CASO';

  const generateTheme = () => {
    const picked = pickRandomTheme(theme);
    setGenerated(picked);
    setTheme(picked.theme);
    if (!title.trim()) setTitle(`Redação — ${picked.category}`);
  };

  const mutation = useMutation({
    mutationFn: () =>
      essayService.submit({
        type,
        title,
        theme,
        content: answerMode === 'text' ? content : undefined,
        file: answerMode === 'file' ? file ?? undefined : undefined,
        role: role || undefined,
        examBoard: examBoard || undefined,
        caseStatement: isCase ? caseStatement : undefined,
        answerKey: isCase ? answerKey : undefined,
        lineLimit: lineLimit ? Number(lineLimit) : undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      onCreated(data.id);
    },
  });

  const handleFiles = (files: FileList | null) => {
    setFileError('');
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Tipo não suportado. Use PDF, JPG, PNG ou WebP.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Arquivo muito grande. Máximo: 10MB.');
      return;
    }
    setFile(f);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  // Estimativa de linhas padrão concurso (~70 caracteres por linha ou quebras explícitas)
  const explicitLines = content.split('\n').length;
  const estimatedLines = Math.max(explicitLines, Math.ceil(charCount / 70));

  const answerOk = answerMode === 'text' ? content.trim().length >= 30 : file !== null;
  const caseOk = !isCase || caseStatement.trim().length >= 10;
  const canSubmit = title.trim().length >= 3 && theme.trim().length >= 3 && answerOk && caseOk;

  return (
    <div className="mx-auto max-w-3xl motion-safe:animate-in motion-safe:fade-in duration-fast">
      <button
        onClick={onBack}
        type="button"
        className="mb-4 min-h-[44px] inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors touch-manipulation active:scale-95 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg px-2"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar para a lista
      </button>

      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Nova Correção com IA</h2>

      <div className="space-y-5 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">Tipo de Prova Discursiva</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <TypeButton
              active={type === 'DISSERTATIVA'}
              onClick={() => setType('DISSERTATIVA')}
              icon={PenLine}
              title="Dissertativa Argumentativa"
              subtitle="Padrão tradicional de concurso (CAC/OT/DLP)"
            />
            <TypeButton
              active={type === 'ESTUDO_CASO'}
              onClick={() => setType('ESTUDO_CASO')}
              icon={ClipboardList}
              title="Estudo de Caso / Prática"
              subtitle="Correção por aspectos analíticos do espelho"
            />
          </div>
        </div>

        <Field id={titleId} label="Título *" value={title} onChange={setTitle} placeholder="Ex: Estudo de Caso — Licitações e Contratos" />

        {isCase ? (
          <Field
            id={themeId}
            label="Tema ou Assunto Central *"
            value={theme}
            onChange={setTheme}
            placeholder="Ex: Gestão e fiscalização de contratos administrativos"
          />
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor={themeId} className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tema da Redação *</label>
              <button
                type="button"
                onClick={generateTheme}
                className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-all hover:bg-primary-100 active:scale-95 touch-manipulation cursor-pointer dark:bg-primary-950/60 dark:text-primary-300 dark:hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 border border-primary-200/60 dark:border-primary-800/60"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Sugerir Tema de Concurso
              </button>
            </div>
            <input
              id={themeId}
              value={theme}
              onChange={(e) => { setTheme(e.target.value); setGenerated(null); }}
              placeholder="Digite um tema ou clique em “Sugerir Tema de Concurso”"
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base sm:text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 font-medium"
            />
            {generated && (
              <div className="mt-3 space-y-2 rounded-xl border border-primary-200 bg-primary-50/60 p-4 text-xs dark:border-primary-900/60 dark:bg-primary-950/40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-fast">
                <span className="inline-block rounded-md bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-800 dark:bg-primary-900 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
                  {generated.category}
                </span>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Comando da Banca: </span>
                  {generated.command}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Expectativa de Conteúdo: </span>
                  {generated.aspects}
                </p>
              </div>
            )}
          </div>
        )}

        {isCase && (
          <div className="space-y-4 rounded-xl border border-primary-100 bg-primary-50/30 p-4.5 dark:border-primary-900/40 dark:bg-primary-950/20">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Cargo / Área" value={role} onChange={setRole} placeholder="Ex: Auditor Fiscal, Analista" />
              <Field label="Banca Examinadora" value={examBoard} onChange={setExamBoard} placeholder="Ex: Cebraspe, FGV, FCC" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Limite de Linhas</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lineLimit}
                  onChange={(e) => setLineLimit(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base sm:text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium"
                />
              </div>
            </div>
            <TextArea
              label="Enunciado / Situação Hipotética *"
              value={caseStatement}
              onChange={setCaseStatement}
              rows={4}
              placeholder="Cole o comando ou situação problema apresentada pela banca..."
            />
            <TextArea
              label="Espelho de Correção da Banca (Opcional)"
              value={answerKey}
              onChange={setAnswerKey}
              rows={4}
              placeholder="Cole os aspectos e a pontuação esperada. Caso omitido, a IA construirá uma matriz de referência especialista."
            />
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor={textAnswerId} className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Resposta {isCase ? 'do candidato' : 'da redação'} *
            </label>
            {answerMode === 'text' && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{wordCount} palavras</span>
                <span>·</span>
                <span>{charCount} caracteres</span>
                <span>·</span>
                <span className={lineLimit && estimatedLines > Number(lineLimit) ? 'text-amber-600 font-semibold dark:text-amber-400' : ''}>
                  ~{estimatedLines} {lineLimit ? `/ ${lineLimit}` : ''} linhas
                </span>
              </div>
            )}
          </div>

          <div className="mb-2.5 flex gap-2">
            <ModeButton active={answerMode === 'text'} onClick={() => setAnswerMode('text')} icon={PenLine} label="Digitar Texto" />
            <ModeButton active={answerMode === 'file'} onClick={() => setAnswerMode('file')} icon={Upload} label="Enviar Arquivo (PDF/Imagem)" />
          </div>

          {answerMode === 'text' ? (
            <textarea
              id={textAnswerId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={11}
              placeholder="Digite ou cole aqui sua resposta..."
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-base sm:text-sm leading-relaxed transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 font-normal"
            />
          ) : file ? (
            <div className="flex items-center gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-950/40 motion-safe:animate-in motion-safe:fade-in">
              {file.type === 'application/pdf' ? <FileText className="h-8 w-8 text-rose-500" /> : <Image className="h-8 w-8 text-primary-500" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setFileError(''); }}
                aria-label="Remover arquivo"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-100 hover:text-gray-700 transition-colors touch-manipulation active:scale-95 dark:hover:bg-emerald-900 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Área de envio de arquivo"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                dragOver
                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 scale-[1.01]'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/30'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`mb-2.5 h-9 w-9 transition-colors ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Arraste a folha de resposta ou clique para selecionar</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG ou WebP — tamanho máximo 10MB</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
          )}
          {fileError && (
            <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              {fileError}
            </p>
          )}
        </div>

        {mutation.isError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Erro ao enviar a redação. Por favor, verifique sua conexão ou tente novamente.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          type="button"
          disabled={!canSubmit || mutation.isPending}
          aria-busy={mutation.isPending}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-xs transition-all duration-fast hover:bg-primary-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          {mutation.isPending ? (
            <span role="status" className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Corrigindo Redação com IA...
            </span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar para Correção Especialista
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof PenLine;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[56px] flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all duration-fast touch-manipulation active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? 'border-primary-500 bg-primary-50/80 shadow-xs ring-2 ring-primary-500/20 dark:border-primary-600 dark:bg-primary-950/50'
          : 'border-gray-200 hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-800/50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        {title}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{subtitle}</span>
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof PenLine;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-fast touch-manipulation active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? 'bg-primary-600 text-white shadow-xs font-bold'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base sm:text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 font-medium"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base sm:text-sm leading-relaxed transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 font-normal"
      />
    </div>
  );
}
