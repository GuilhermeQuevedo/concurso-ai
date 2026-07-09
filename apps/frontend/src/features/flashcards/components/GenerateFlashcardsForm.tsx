import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FileText, Loader2, Sparkles, Type } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import { flashcardService } from '../services/flashcard.service';

type Source = 'text' | 'document';

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

export function GenerateFlashcardsForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState('');
  const [source, setSource] = useState<Source>('text');
  const [text, setText] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [count, setCount] = useState(10);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => documentService.list() });

  const mutation = useMutation({
    mutationFn: () =>
      flashcardService.generate({
        subjectId,
        count,
        text: source === 'text' ? text : undefined,
        documentId: source === 'document' ? documentId : undefined,
      }),
    onSuccess: (cards) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
      setCreatedCount(cards.length);
    },
  });

  const canSubmit =
    subjectId &&
    ((source === 'text' && text.trim().length >= 50) || (source === 'document' && documentId));

  if (createdCount !== null) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary-500" />
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          {createdCount} flashcards criados!
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          A IA transformou o seu conteúdo em cartões de revisão espaçada.
        </p>
        <button
          onClick={onDone}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          Ver flashcards
        </button>
      </div>
    );
  }

  const flatSubjects = flatten(subjects);

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ChevronLeft className="mr-1 inline h-4 w-4" />
        Voltar
      </button>

      <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Gerar Flashcards com IA</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Cole o que você estudou ou escolha um documento. A IA cria os cartões de pergunta e resposta.
      </p>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione...</option>
            {flatSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <SourceButton active={source === 'text'} onClick={() => setSource('text')} icon={Type} label="Colar texto" />
          <SourceButton active={source === 'document'} onClick={() => setSource('document')} icon={FileText} label="De um documento" />
        </div>

        {source === 'text' ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Conteúdo estudado <span className="font-normal text-gray-400">(mínimo 50 caracteres)</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Cole aqui suas anotações, um resumo ou o texto que você acabou de estudar..."
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400">{text.trim().length} caracteres</p>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Documento</label>
            {documents.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Nenhum documento enviado. Suba um PDF/nota em Estudos → Documentos.
              </p>
            ) : (
              <select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantidade de flashcards: <span className="font-bold text-primary-600">{count}</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            Erro ao gerar flashcards. Verifique o conteúdo e tente novamente.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Flashcards
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SourceButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Type;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
