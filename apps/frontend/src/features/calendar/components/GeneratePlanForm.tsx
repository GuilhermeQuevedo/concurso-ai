import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2, Sparkles, X } from 'lucide-react';
import { contestService } from '@/features/contests/services/contest.service';
import { formatExamDate } from '@/features/contests/components/ContestCard';
import { studyTaskService } from '../services/study-task.service';

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function GeneratePlanForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [contestId, setContestId] = useState('');
  const [minutesPerDay, setMinutesPerDay] = useState(120);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  const { data: contests = [] } = useQuery({
    queryKey: ['contests'],
    queryFn: contestService.list,
  });

  const eligible = contests.filter((c) => c.examDate && new Date(c.examDate) > new Date());

  const mutation = useMutation({
    mutationFn: () => studyTaskService.generatePlan({ contestId, minutesPerDay, studyWeekdays: weekdays }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-tasks'] });
      onClose();
    },
    onError: () => setError('Erro ao gerar o plano. Verifique se o objetivo tem data de prova futura e tópicos pendentes.'),
  });

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <CalendarClock className="h-4 w-4 text-primary-500" />
          Gerar Plano de Estudo Retroativo
        </h3>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        O plano distribui todos os tópicos pendentes do edital pelos dias até a prova, com revisões
        espaçadas (+3 e +7 dias), redação semanal e revisão geral na reta final.
      </p>

      {eligible.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Nenhum objetivo com data de prova futura. Cadastre um em "Meus Objetivos".
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Objetivo</label>
            <select
              value={contestId}
              onChange={(e) => setContestId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecione...</option>
              {eligible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — prova {c.examDate ? formatExamDate(c.examDate) : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tempo de estudo por dia: <span className="font-bold text-primary-600">{Math.floor(minutesPerDay / 60)}h{minutesPerDay % 60 > 0 ? `${minutesPerDay % 60}min` : ''}</span>
            </label>
            <input
              type="range"
              min={30}
              max={480}
              step={30}
              value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Dias de estudo</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleWeekday(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    weekdays.includes(value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={!contestId || weekdays.length === 0 || mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando plano...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Plano
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
