import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Upload, FileText, Layers, ListChecks, Loader2, CheckCircle2, Info } from 'lucide-react';
import { contentService } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import {
  studyKitService,
  type StudyKitOutput,
  type StudyKitResult,
} from '@/features/study-kit/services/study-kit.service';

const OUTPUT_OPTIONS: { key: StudyKitOutput; label: string; icon: typeof FileText }[] = [
  { key: 'summary', label: 'Resumo do conteúdo', icon: FileText },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'questions', label: 'Questões', icon: ListChecks },
];

export function StudyKitPage() {
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });

  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [outputs, setOutputs] = useState<Set<StudyKitOutput>>(new Set(['summary', 'flashcards', 'questions']));
  const [flashcardsCount, setFlashcardsCount] = useState(10);
  const [questionsCount, setQuestionsCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'' | 'EASY' | 'MEDIUM' | 'HARD'>('');
  const [result, setResult] = useState<StudyKitResult | null>(null);

  const toggleOutput = (key: StudyKitOutput) => {
    setOutputs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um PDF.');
      const doc = await documentService.upload(file, { subjectId });
      return studyKitService.generate({
        documentId: doc.id,
        subjectId,
        outputs: [...outputs],
        flashcardsCount,
        questionsCount,
        difficulty: difficulty || undefined,
      });
    },
    onSuccess: (data) => setResult(data),
  });

  const canSubmit = !!file && !!subjectId && outputs.size > 0 && !mutation.isPending;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-primary-600 dark:bg-gray-800">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerar material com IA</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envie um PDF e gere resumo, flashcards e questões a partir do próprio conteúdo.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          É um <strong>edital</strong>? Use <Link to="/contests" className="font-semibold underline">Meus Objetivos</Link> para extrair o conteúdo programático. Esta tela é para <strong>materiais de estudo</strong> (apostilas, PDFs de conteúdo).
        </span>
      </div>

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione a disciplina…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {subjects.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Nenhuma disciplina ainda. <Link to="/subjects" className="underline">Crie uma primeiro.</Link>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Arquivo PDF</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-primary-400 dark:border-gray-700 dark:text-gray-300">
            <Upload className="h-4 w-4 text-gray-400" />
            {file ? file.name : 'Escolher PDF'}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">O que gerar</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {OUTPUT_OPTIONS.map((opt) => {
              const active = outputs.has(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleOutput(opt.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {outputs.has('flashcards') && (
            <NumberField label="Qtd. flashcards" value={flashcardsCount} min={1} max={30} onChange={setFlashcardsCount} />
          )}
          {outputs.has('questions') && (
            <>
              <NumberField label="Qtd. questões" value={questionsCount} min={1} max={10} onChange={setQuestionsCount} />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Variada</option>
                  <option value="EASY">Fácil</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HARD">Difícil</option>
                </select>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {mutation.isPending ? 'Gerando material…' : 'Gerar material'}
        </button>
        {mutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {mutation.error instanceof Error ? mutation.error.message : 'Falha ao gerar. Tente novamente.'}
          </p>
        )}
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}

function ResultCard({ result }: { result: StudyKitResult }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        Material gerado com sucesso!
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {result.flashcards > 0 && (
          <Link to="/flashcards" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.flashcards}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">flashcards criados — revisar agora</p>
          </Link>
        )}
        {result.questions > 0 && (
          <Link to="/generate" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.questions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">questões criadas — praticar</p>
          </Link>
        )}
      </div>

      {result.summary && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Resumo do conteúdo</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {result.summary}
          </div>
        </div>
      )}
    </div>
  );
}
