import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Plus, Bell, Sparkles } from 'lucide-react';

import { useActiveStudy } from '@/features/active-study/active-study-context';
import { addDays, dayKey, formatLongDate, startOfWeek, weekTitle, type CalendarView } from '@/features/calendar/calendar-dates';
import { applyFilters, ALL_KINDS, groupByDay, type CalendarItem, type ItemFilters } from '@/features/calendar/calendar-items';
import { CalendarFilters } from '@/features/calendar/components/CalendarFilters';
import { CalendarMonthView, monthTitle } from '@/features/calendar/components/CalendarMonthView';
import { CalendarWeekView } from '@/features/calendar/components/CalendarWeekView';
import { ExamsPanel } from '@/features/calendar/components/ExamsPanel';
import { GeneratePlanForm } from '@/features/calendar/components/GeneratePlanForm';
import { GoogleCalendarPluginModal } from '@/features/calendar/components/GoogleCalendarPluginModal';
import { ItemDetailDialog } from '@/features/calendar/components/ItemDetailDialog';
import { NewItemDialog, type NewItemInput, type NewItemKind } from '@/features/calendar/components/NewItemDialog';
import { useCalendarData } from '@/features/calendar/hooks/useCalendarData';
import { contestService } from '@/features/contests/services/contest.service';
import { subjectColor } from '@/features/questions/subjectColor';

const MONTH_MARGIN_DAYS = 7;
const btn =
  'flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800';

export function CalendarPage() {
  const now = new Date();
  const today = dayKey(now);
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [filters, setFilters] = useState<ItemFilters>({ kinds: new Set(ALL_KINDS), hiddenSubjects: new Set() });
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ date: string; kind: NewItemKind } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPlugin, setShowPlugin] = useState(false);

  const anchorDate = new Date(`${anchor}T12:00:00`);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const range = useMemo(
    () =>
      view === 'month'
        ? { from: addDays(dayKey(new Date(year, month, 1)), -MONTH_MARGIN_DAYS), to: addDays(dayKey(new Date(year, month + 1, 0)), MONTH_MARGIN_DAYS) }
        : { from: startOfWeek(anchor), to: addDays(startOfWeek(anchor), 6) },
    [view, anchor, year, month],
  );

  const { activeContestId } = useActiveStudy();
  const data = useCalendarData(range, activeContestId);
  const { data: contests = [] } = useQuery({ queryKey: ['contests'], queryFn: contestService.list });

  const subjects = useMemo(() => {
    const names = [...new Set(data.items.map((i) => i.subject).filter((s): s is string => Boolean(s)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return names.map((name) => ({ name, color: subjectColor(name) }));
  }, [data.items]);

  const visible = useMemo(() => applyFilters(data.items, filters), [data.items, filters]);
  const itemsByDay = useMemo(() => groupByDay(visible), [visible]);
  const examDays = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contests) if (c.examDate) map.set(c.examDate.slice(0, 10), c.name);
    return map;
  }, [contests]);

  const openItem = data.items.find((i) => i.id === openItemId) ?? null;
  const step = (delta: number) =>
    setAnchor(view === 'month' ? dayKey(new Date(year, month + delta, 1)) : addDays(anchor, delta * 7));
  const goToday = () => {
    setAnchor(today);
    setSelectedDay(today);
  };
  const submitNew = (input: NewItemInput) => data.create.mutate(input, { onSuccess: () => setNewItem(null) });
  const selectedItems = itemsByDay.get(selectedDay) ?? [];
  const title = view === 'month' ? monthTitle(year, month) : weekTitle(anchor);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
          <button type="button" onClick={goToday} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            Hoje
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setNewItem({ date: selectedDay, kind: 'tarefa' })} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Nova tarefa
          </button>
          <button type="button" onClick={() => setNewItem({ date: selectedDay, kind: 'lembrete' })} className={btn}>
            <Bell className="h-4 w-4" /> Lembrete
          </button>
          <button type="button" onClick={() => setShowGenerate(!showGenerate)} className={btn}>
            <Sparkles className="h-4 w-4" /> Gerar plano
          </button>
          <button type="button" onClick={() => setShowPlugin(true)} className={btn}>
            Google Calendar
          </button>
          <div role="group" aria-label="Visualização" className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            {(['month', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={`px-3 py-1.5 text-sm font-medium ${view === option ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}`}
              >
                {option === 'month' ? 'Mensal' : 'Semanal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ExamsPanel contests={contests} />
      {showGenerate && <GeneratePlanForm onClose={() => setShowGenerate(false)} />}
      <CalendarFilters filters={filters} subjects={subjects} onChange={setFilters} />

      <div className="mb-3 flex items-center justify-center gap-4">
        <button type="button" aria-label="Anterior" onClick={() => step(-1)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-48 text-center text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <button type="button" aria-label="Próximo" onClick={() => step(1)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {data.loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : view === 'month' ? (
        <>
          <CalendarMonthView
            year={year}
            month={month}
            itemsByDay={itemsByDay}
            examDays={examDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onOpenItem={(item: CalendarItem) => setOpenItemId(item.id)}
            onAdd={(date) => setNewItem({ date, kind: 'tarefa' })}
          />
          <DaySummary day={selectedDay} items={selectedItems} onOpen={(item) => setOpenItemId(item.id)} />
        </>
      ) : (
        <CalendarWeekView
          anchorDay={anchor}
          itemsByDay={itemsByDay}
          examDays={examDays}
          onOpenItem={(item) => setOpenItemId(item.id)}
          onAdd={(date) => setNewItem({ date, kind: 'tarefa' })}
        />
      )}

      {openItem && (
        <ItemDetailDialog
          item={openItem}
          busy={data.toggle.isPending || data.remove.isPending}
          onToggle={(item) => data.toggle.mutate(item)}
          onDelete={(item) => data.remove.mutate(item, { onSuccess: () => setOpenItemId(null) })}
          onClose={() => setOpenItemId(null)}
        />
      )}
      {newItem && (
        <NewItemDialog
          initialDate={newItem.date}
          initialKind={newItem.kind}
          subjects={subjects.map((s) => s.name)}
          saving={data.create.isPending}
          onSubmit={submitNew}
          onClose={() => setNewItem(null)}
        />
      )}
      {showPlugin && <GoogleCalendarPluginModal onClose={() => setShowPlugin(false)} />}
    </div>
  );
}

function DaySummary({ day, items, onOpen }: { day: string; items: CalendarItem[]; onOpen: (item: CalendarItem) => void }) {
  return (
    <section aria-label="Itens do dia" className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{formatLongDate(day)}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Nada marcado para este dia.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onOpen(item)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${item.done ? 'opacity-50' : ''}`}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className={`min-w-0 flex-1 truncate text-gray-800 dark:text-gray-100 ${item.done ? 'line-through' : ''}`}>{item.title}</span>
                {item.detail && <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">{item.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CalendarPage;
