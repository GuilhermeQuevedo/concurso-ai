import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { studyScheduleService } from '../services/study-schedule.service';
import type { StudySchedule } from '../types';
import { setCreatingNew } from '../utils/schedule-draft';
import { reorganizeSchedule } from '../utils/schedule-reorganize';
import type { ScheduleSession } from './useScheduleSession';

function localDayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, '0')}`;
}

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
  const queryClient = useQueryClient();
  // O Calendário lê a lista de cronogramas salvos; qualquer mudança aqui precisa chegar lá.
  const syncCalendar = () => void queryClient.invalidateQueries({ queryKey: ['study-schedules'] });

  const save = async () => {
    if (!schedule) return;
    if (schedule.id) return toast.success('Este cronograma já está salvo!');
    setIsSaving(true);
    try {
      const saved = await studyScheduleService.saveSchedule(schedule);
      setSchedule(saved);
      setSavedSchedules((prev) => [saved, ...prev]);
      clearDraft();
      syncCalendar();
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
      syncCalendar();
    } catch (error: unknown) {
      setSchedule(previous);
      toast.error(getErrorMessage(error, 'Não foi possível sincronizar a conclusão do dia.'));
    }
  };

  const reorganize = async () => {
    if (!schedule) return;
    const result = reorganizeSchedule(schedule, localDayKey());
    if (!result) return toast.error('Não há dias pendentes para reorganizar, ou a data da prova já passou.');
    if (!window.confirm('Redistribuir os dias pendentes a partir de hoje até a prova? Os dias concluídos não mudam.')) return;
    const previous = schedule;
    setSchedule(result.schedule);
    if (schedule.id) {
      try {
        await studyScheduleService.replaceWeeks(schedule.id, result.schedule.schedule.weeks);
        syncCalendar();
      } catch (error: unknown) {
        setSchedule(previous);
        return toast.error(getErrorMessage(error, 'Não foi possível salvar a reorganização.'));
      }
    }
    const merged = result.merged > 0 ? ` ${result.merged} dia(s) foram juntados por falta de datas até a prova.` : '';
    toast.success(`Cronograma reorganizado: ${result.moved} dia(s) redistribuídos.${merged}`);
  };

  const remove = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cronograma?')) return;
    try {
      await studyScheduleService.deleteSchedule(id);
      setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
      syncCalendar();
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

  return { isSaving, save, toggleDay, reorganize, remove, rename, select, createAnother };
}
