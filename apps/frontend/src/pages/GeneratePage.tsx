import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { questionService, type QuestionDTO, type GenerateParams } from '@/features/questions/services/question.service';

const difficultyOptions = [
  { value: '', label: 'Qualquer' },
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
] as const;

export function GeneratePage() {
  const [subjectId, setSubjectId] = useState('');
  const [examBoardId, setExamBoardId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const { data: examBoards = [] } = useQuery({
    queryKey: ['exam-boards'],
    queryFn: contentService.getExamBoards,
  });

  const generateMutation = useMutation({
    mutationFn: (params: GenerateParams) => questionService.generate(params),
    onSuccess: (data) => {
      setQuestions(data);
      setSelectedAnswers({});
      setExpandedId(null);
    },
  });

  const handleGenerate = () => {
    if (!subjectId) return;
    const params: GenerateParams = { subjectId, quantity };
    if (examBoardId) params.examBoardId = examBoardId;
    if (difficulty) params.difficulty = difficulty as 'EASY' | 'MEDIUM' | 'HARD';
    if (topic.trim()) params.topic = topic.trim();
    generateMutation.mutate(params);
  };

  const handleSelectAnswer = (questionId: string, letter: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const flatSubjects = flattenSubjects(subjects);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerar Questões</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure e gere questões com inteligência artificial
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disciplina *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecione...</option>
              {flatSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prefix}{s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Banca
            </label>
            <select
              value={examBoardId}
              onChange={(e) => setExamBoardId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Qualquer banca</option>
              {examBoards.map((b: ExamBoardDTO) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dificuldade
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {difficultyOptions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tópico específico (opcional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Princípios fundamentais, Direitos e Garantias..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!subjectId || generateMutation.isPending}
          className="mt-5 flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generateMutation.isPending ? 'Gerando...' : 'Gerar Questões'}
        </button>

        {generateMutation.isError && (
          <p className="mt-3 text-sm text-red-500">Erro ao gerar questões. Tente novamente.</p>
        )}
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {questions.length} questão(ões) gerada(s)
          </h2>

          {questions.map((q, index) => {
            const selected = selectedAnswers[q.id];
            const isExpanded = expandedId === q.id;
            const isAnswered = !!selected;
            const isCorrect = selected === q.correctAnswer;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      Questão {index + 1}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      q.difficulty === 'EASY' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {q.difficulty === 'EASY' ? 'Fácil' : q.difficulty === 'MEDIUM' ? 'Média' : 'Difícil'}
                    </span>
                  </div>

                  <p className="mb-4 text-sm text-gray-800 dark:text-gray-200">{q.statement}</p>

                  <div className="space-y-2">
                    {q.alternatives.map((alt) => {
                      const isSelected = selected === alt.letter;
                      const showResult = isAnswered;
                      const isCorrectAlt = alt.letter === q.correctAnswer;

                      let borderClass = 'border-gray-200 dark:border-gray-700';
                      if (showResult && isCorrectAlt) borderClass = 'border-green-500 bg-green-50 dark:bg-green-950';
                      else if (showResult && isSelected && !isCorrect) borderClass = 'border-red-500 bg-red-50 dark:bg-red-950';

                      return (
                        <button
                          key={alt.letter}
                          onClick={() => !isAnswered && handleSelectAnswer(q.id, alt.letter)}
                          disabled={isAnswered}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${borderClass} ${
                            !isAnswered ? 'hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-700 dark:hover:bg-primary-950' : ''
                          }`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium dark:border-gray-600">
                            {alt.letter}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{alt.text}</span>
                          {showResult && isCorrectAlt && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-500" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? 'Ocultar explicação' : 'Ver explicação'}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {questions.length === 0 && !generateMutation.isPending && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure os parâmetros acima e clique em "Gerar Questões"
          </p>
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
