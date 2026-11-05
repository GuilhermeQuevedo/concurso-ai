import { useState } from 'react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { studyScheduleService } from '../services/study-schedule.service';
import type { StudySchedule } from '../types';
import { setCreatingNew } from '../utils/schedule-draft';
import type { ScheduleSession } from './useScheduleSession';

function toggleDayAt(schedule: StudySchedule, weekIndex: number, dayIndex: number): StudySchedule {
  const weeks = schedule.schedule.weeks.map((week, w) =>
    w !== weekIndex
      ? week
      : { ...week, days: week.days.map((day, d) => (d === dayIndex ? { ...day, completed: !day.completed } : day)) },
  );
  return { ...schedule, schedule: { ...schedule.schedule, weeks } };
}

export function useScheduleActions({ schedule, setSchedule, setSavedSchedules, clearDraft }: ScheduleSession) {
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!schedule) return;
    if (schedule.id) return toast.success('Este cronograma já está salvo!');
    setIsSaving(true);
    try {
      const saved = await studyScheduleService.saveSchedule(schedule);
      setSchedule(saved);
      setSavedSchedules((prev) => [saved, ...prev]);
      clearDraft();
      toast.success('Cronograma salvo com sucesso!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Erro ao salvar cronograma.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = async (weekIndex: number, dayIndex: number) => {
    if (!schedule?.schedule?.weeks) return;
    const previous = schedule;
    setSchedule(toggleDayAt(schedule, weekIndex, dayIndex));
    if (!schedule.id) return;
    try {
      await studyScheduleService.toggleDayCompletion(schedule.id, weekIndex, dayIndex);
    } catch (error: unknown) {
      setSchedule(previous);
      toast.error(getErrorMessage(error, 'Não foi possível sincronizar a conclusão do dia.'));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cronograma?')) return;
    try {
      await studyScheduleService.deleteSchedule(id);
      setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
      if (schedule?.id === id) {
        setSchedule(null);
        clearDraft();
      }
      toast.success('Cronograma excluído.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Erro ao excluir cronograma.'));
    }
  };

  const rename = async (target: StudySchedule, name: string): Promise<boolean> => {
    if (!name.trim() || !target.id) return false;
    try {
      await studyScheduleService.updateName(target.id, name.trim());
      const renamed = { ...target.schedule, title: name.trim() };
      setSavedSchedules((prev) => prev.map((s) => (s.id === target.id ? { ...s, schedule: renamed } : s)));
      setSchedule((current) => (current && current.id === target.id ? { ...current, schedule: renamed } : current));
      toast.success('Nome atualizado!');
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Erro ao atualizar nome.'));
      return false;
    }
  };

  const select = (target: StudySchedule) => {
    setCreatingNew(false);
    setSchedule(target);
  };

  const createAnother = () => {
    setCreatingNew(true);
    clearDraft();
    setSchedule(null);
  };

  return { isSaving, save, toggleDay, remove, rename, select, createAnother };
}
