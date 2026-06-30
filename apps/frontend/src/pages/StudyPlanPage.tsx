import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  TrendingDown,
  BookOpen,
} from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  studyPlanService,
  type StudyPlanDTO,
  type SubjectSuggestion,
} from '@/features/study-plan/services/study-plan.service';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function StudyPlanPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['study-plans'],
    queryFn: studyPlanService.list,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['study-plan-suggestions'],
    queryFn: studyPlanService.getSuggestions,
  });

  const activePlan = plans.find((p) => p.active);

  const toggleMutation = useMutation({
    mutationFn: studyPlanService.toggleItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-plans'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: studyPlanService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-plans'] }),
  });

  if (showCreate) {
    return <CreatePlan onBack={() => setShowCreate(false)} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plano de Estudos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize sua rotina de estudos por disciplina
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Novo Plano
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <div className="mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              Disciplinas que precisam de atenção
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 5).map((s: SubjectSuggestion) => (
              <span
                key={s.subjectId}
                className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              >
                {s.name}: {s.accuracy}% ({s.total} questões)
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nenhum plano de estudos
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Crie um plano para organizar sua rotina semanal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: StudyPlanDTO) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isActive={plan.id === activePlan?.id}
              onToggleItem={(itemId) => toggleMutation.mutate(itemId)}
              onDelete={() => deleteMutation.mutate(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  isActive,
  onToggleItem,
  onDelete,
}: {
  plan: StudyPlanDTO;
  isActive: boolean;
  onToggleItem: (itemId: string) => void;
  onDelete: () => void;
}) {
  const completedCount = plan.items.filter((i) => i.completed).length;
  const progress = plan.items.length > 0 ? Math.round((completedCount / plan.items.length) * 100) : 0;

  const itemsByDay: Record<number, typeof plan.items> = {};
  for (const item of plan.items) {
    if (!itemsByDay[item.dayOfWeek]) itemsByDay[item.dayOfWeek] = [];
    itemsByDay[item.dayOfWeek].push(item);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary-600" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              {isActive && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(plan.startDate).toLocaleDateString('pt-BR')} —{' '}
              {new Date(plan.endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{progress}% concluído</span>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayItems = itemsByDay[day];
          if (!dayItems || dayItems.length === 0) return null;
          return (
            <div key={day} className="flex gap-4 px-5 py-3">
              <span className="w-10 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400 pt-0.5">
                {DAY_NAMES[day]}
              </span>
              <div className="flex flex-wrap gap-2">
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      item.completed
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                        : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {item.subject.name} ({item.duration}min)
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatePlan({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<{ subjectId: string; dayOfWeek: number; duration: number }[]>([]);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const flatSubjects = flattenSubjects(subjects);

  const createMutation = useMutation({
    mutationFn: () => studyPlanService.create({ name, startDate, endDate, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      onBack();
    },
  });

  const addItem = () => {
    setItems([...items, { subjectId: '', dayOfWeek: 1, duration: 60 }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const isValid = name.trim() && startDate && endDate && items.length > 0 && items.every((i) => i.subjectId);

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        ← Voltar
      </button>
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Novo Plano de Estudos</h2>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Preparação TRT"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Início *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fim *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens do Plano *</label>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Adicione disciplinas ao plano
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800">
                  <select
                    value={item.subjectId}
                    onChange={(e) => updateItem(idx, 'subjectId', e.target.value)}
                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Disciplina...</option>
                    {flatSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={item.dayOfWeek}
                    onChange={(e) => updateItem(idx, 'dayOfWeek', Number(e.target.value))}
                    className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {DAY_NAMES.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.duration}
                    onChange={(e) => updateItem(idx, 'duration', Number(e.target.value))}
                    min={15}
                    max={480}
                    className="w-16 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">min</span>
                  <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Criar Plano
        </button>
      </div>
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
