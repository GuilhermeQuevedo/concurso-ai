import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Play, Building2, Calendar, Tag, Search, X } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { questionService, type QuestionDTO, type GenerateParams } from '@/features/questions/services/question.service';
import { documentService } from '@/features/documents/services/document.service';

const difficultyOptions = [
  { value: '', label: 'Qualquer' },
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
] as const;

export function GeneratePage() {
  const navigate = useNavigate();
  const [subjectId, setSubjectId] = useState('');
  const [examBoardId, setExamBoardId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [topic, setTopic] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [bancaSearch, setBancaSearch] = useState('');
  const [bancaOpen, setBancaOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const bancaRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const { data: examBoards = [] } = useQuery({
    queryKey: ['exam-boards'],
    queryFn: contentService.getExamBoards,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.list(),
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
    if (documentId) params.documentId = documentId;
    generateMutation.mutate(params);
  };

  const handleSelectAnswer = (questionId: string, letter: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const flatSubjects = flattenSubjects(subjects);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bancaRef.current && !bancaRef.current.contains(e.target as Node)) setBancaOpen(false);
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) setSubjectOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBoards = examBoards.filter((b: ExamBoardDTO) =>
    b.name.toLowerCase().includes(bancaSearch.toLowerCase())
  );

  const filteredSubjects = flatSubjects.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const selectedBancaName = examBoards.find((b: ExamBoardDTO) => b.id === examBoardId)?.name || '';
  const selectedSubjectName = flatSubjects.find((s) => s.id === subjectId)?.name || '';

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
          <div ref={subjectRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disciplina *
            </label>
            <div
              className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
              onClick={() => setSubjectOpen(!subjectOpen)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {subjectOpen ? (
                <input
                  autoFocus
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Buscar disciplina..."
                  className="w-full bg-transparent outline-none placeholder-gray-400"
                />
              ) : (
                <span className={`flex-1 truncate ${subjectId ? '' : 'text-gray-400'}`}>
                  {selectedSubjectName || 'Selecione...'}
                </span>
              )}
              {subjectId && (
                <button onClick={(e) => { e.stopPropagation(); setSubjectId(''); setSubjectSearch(''); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </div>
            {subjectOpen && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {filteredSubjects.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">Nenhuma disciplina encontrada</p>
                ) : (
                  filteredSubjects.slice(0, 50).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSubjectId(s.id); setSubjectOpen(false); setSubjectSearch(''); }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-primary-950 ${
                        s.id === subjectId ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {s.prefix}{s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div ref={bancaRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Banca
            </label>
            <div
              className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
              onClick={() => setBancaOpen(!bancaOpen)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {bancaOpen ? (
                <input
                  autoFocus
                  value={bancaSearch}
                  onChange={(e) => setBancaSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Buscar banca..."
                  className="w-full bg-transparent outline-none placeholder-gray-400"
                />
              ) : (
                <span className={`flex-1 truncate ${examBoardId ? '' : 'text-gray-400'}`}>
                  {selectedBancaName || 'Qualquer banca'}
                </span>
              )}
              {examBoardId && (
                <button onClick={(e) => { e.stopPropagation(); setExamBoardId(''); setBancaSearch(''); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </div>
            {bancaOpen && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => { setExamBoardId(''); setBancaOpen(false); setBancaSearch(''); }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-primary-950 ${
                    !examBoardId ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Qualquer banca
                </button>
                {filteredBoards.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">Nenhuma banca encontrada</p>
                ) : (
                  filteredBoards.slice(0, 50).map((b: ExamBoardDTO) => (
                    <button
                      key={b.id}
                      onClick={() => { setExamBoardId(b.id); setBancaOpen(false); setBancaSearch(''); }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-primary-950 ${
                        b.id === examBoardId ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))
                )}
              </div>
            )}
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

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Basear nas minhas anotações (opcional)
            </label>
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Não — usar banco de questões reais</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Escolha um documento e a IA cria questões inéditas cobrando exatamente o que está nas
              suas anotações.
            </p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {questions.length} questão(ões) gerada(s)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/study', { state: { questions, mode: 'STUDY', subjectId, examBoardId: examBoardId || undefined, difficulty: difficulty || undefined } })}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                Modo Estudo
              </button>
              <button
                onClick={() => navigate('/study', { state: { questions, mode: 'EXAM', subjectId, examBoardId: examBoardId || undefined, difficulty: difficulty || undefined } })}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Play className="h-4 w-4" />
                Modo Simulado
              </button>
            </div>
          </div>

          {questions.map((q, index) => {
            const selected = selectedAnswers[q.id];
            const isExpanded = expandedId === q.id;
            const isAnswered = !!selected;
            const isCorrect = selected === q.correctAnswer;
            const meta = extractQuestionMeta(q);

            return (
              <div
                key={q.id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
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
                    <div className="flex flex-wrap items-center gap-2">
                      {meta.examBoard && (
                        <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <Building2 className="h-3 w-3" />
                          {meta.examBoard}
                        </span>
                      )}
                      {meta.year && (
                        <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <Calendar className="h-3 w-3" />
                          {meta.year}
                        </span>
                      )}
                    </div>
                  </div>

                  {meta.source && (
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {meta.source}
                    </p>
                  )}

                  {meta.subtopics.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {q.subject && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          <Tag className="h-3 w-3" />
                          {q.subject.name}
                        </span>
                      )}
                      {meta.subtopics.map((st, i) => (
                        <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {st}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mb-4 text-sm text-gray-800 dark:text-gray-200">{meta.cleanStatement}</p>

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

interface QuestionMeta {
  examBoard: string | null;
  year: string | null;
  source: string | null;
  subtopics: string[];
  cleanStatement: string;
}

function extractQuestionMeta(q: QuestionDTO): QuestionMeta {
  const comments = (q.comments || []) as Array<{ type: string; data: unknown }>;
  const subtopicEntry = comments.find((c) => c.type === 'subtopics');
  const examEntry = comments.find((c) => c.type === 'exam');
  const orgEntry = comments.find((c) => c.type === 'org');

  const subtopics = subtopicEntry ? (subtopicEntry.data as string[]) : [];
  const source = examEntry ? (examEntry.data as string) : null;

  let examBoard = q.examBoard?.name || null;
  let year: string | null = null;
  let cleanStatement = q.statement;

  const headerMatch = cleanStatement.match(/^\(([^)]+)\)\s*/);
  if (headerMatch) {
    const headerParts = headerMatch[1].split(' - ').map((p) => p.trim());
    const yearPart = headerParts.find((p) => /^\d{4}$/.test(p));
    if (yearPart) year = yearPart;
    if (!examBoard) {
      examBoard = headerParts.find((p) => !(/^\d{4}$/.test(p)) && p !== (orgEntry?.data as string)) || null;
    }
    cleanStatement = cleanStatement.replace(headerMatch[0], '').trim();
  }

  cleanStatement = cleanStatement.replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();

  return { examBoard, year, source, subtopics, cleanStatement };
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
