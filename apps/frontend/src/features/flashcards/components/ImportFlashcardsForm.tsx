import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FileUp, Loader2, Upload } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import { flashcardService } from '../services/flashcard.service';

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

export function ImportFlashcardsForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState('');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });

  const mutation = useMutation({
    mutationFn: () => flashcardService.import({ subjectId, text }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
      setResult(data);
    },
  });

  const handleFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      // Tenta UTF-8; se vier lixo (arquivo ANSI/Windows-1252), refaz a decodificação
      let decoded = new TextDecoder('utf-8').decode(buf);
      if (decoded.includes('�')) {
        decoded = new TextDecoder('windows-1252').decode(buf);
      }
      setText(decoded);
      setFileName(file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  if (result) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <FileUp className="mx-auto mb-3 h-10 w-10 text-primary-500" />
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          {result.imported} flashcards importados!
        </h2>
        {result.skipped > 0 && (
          <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
            {result.skipped} linha(s) ignorada(s) por não ter frente e verso.
          </p>
        )}
        <button
          onClick={onDone}
          className="mt-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
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

      <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">Importar Flashcards</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Traga seus baralhos do Anki, Quizlet, Excel ou de qualquer lugar: um cartão por linha, com
        frente e verso separados por tab, ponto e vírgula ou vírgula.
      </p>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <p className="mb-1 font-medium">Como exportar do Anki:</p>
          <p>
            No Anki: Arquivo → Exportar → formato "Notas em Texto Simples (.txt)" → Exportar. Depois
            envie o arquivo aqui.
          </p>
        </div>

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

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
          >
            <Upload className="h-4 w-4" />
            {fileName ? `Arquivo: ${fileName}` : 'Escolher arquivo (.txt ou .csv)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.tsv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ou cole o conteúdo aqui
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setFileName(''); }}
            rows={7}
            placeholder={'O que é habeas corpus?\tRemédio constitucional que protege a liberdade de locomoção\nQual o prazo do mandado de segurança?\t120 dias'}
            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            {text.trim() ? `${text.trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#')).length} linha(s) detectada(s)` : 'Nenhum conteúdo ainda'}
          </p>
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            Não foi possível importar. Confira se cada linha tem frente e verso separados por tab,
            ponto e vírgula ou vírgula.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!subjectId || !text.trim() || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              Importar Flashcards
            </>
          )}
        </button>
      </div>
    </div>
  );
}
