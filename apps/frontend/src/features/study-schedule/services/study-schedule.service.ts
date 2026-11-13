import { api, unwrapData } from '@/services/api';
import type { ScheduleWeek, StudySchedule } from '../types';
import type { ScheduleAvailability } from '../wizard/schedule-wizard.model';

export interface GenerateScheduleParams {
  examDate: string;
  dailyHours: number;
  subjects: string[];
  userObservations?: string;
  availability?: ScheduleAvailability;
  forceRefresh?: boolean;
  saveToDb?: boolean;
}

export const studyScheduleService = {
  async generateSchedule(
    params: GenerateScheduleParams,
    file?: File | null,
  ): Promise<StudySchedule> {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('examDate', params.examDate);
      formData.append('dailyHours', String(params.dailyHours));
      formData.append('subjects', JSON.stringify(params.subjects));
      if (params.userObservations) formData.append('userObservations', params.userObservations);
      if (params.availability) formData.append('availability', JSON.stringify(params.availability));
      formData.append('forceRefresh', String(Boolean(params.forceRefresh)));
      formData.append('saveToDb', String(Boolean(params.saveToDb)));

      // Do NOT set Content-Type header manually; browser will set multipart/form-data with proper boundary
      const res = await api.post('/study-schedules/generate', formData);
      return unwrapData(res);
    }

    const res = await api.post('/study-schedules/generate', params);
    return unwrapData(res);
  },

  async listSchedules(): Promise<StudySchedule[]> {
    const res = await api.get('/study-schedules');
    return unwrapData(res);
  },

  async getSchedule(id: string): Promise<StudySchedule> {
    const res = await api.get(`/study-schedules/${id}`);
    return unwrapData(res);
  },

  async saveSchedule(schedule: Partial<StudySchedule>): Promise<StudySchedule> {
    const res = await api.post('/study-schedules', {
      examDate: schedule.examDate || schedule.exam_date,
      dailyHours: schedule.dailyHours || schedule.daily_hours,
      subjects: schedule.subjects,
      schedule: schedule.schedule,
      hasPerformanceData: schedule.hasPerformanceData || schedule.has_performance_data || false,
      contestId: schedule.contestId ?? undefined,
    });
    return unwrapData(res);
  },

  async updateName(id: string, title: string): Promise<StudySchedule> {
    const res = await api.patch(`/study-schedules/${id}/name`, { title });
    return unwrapData(res);
  },

  async toggleDayCompletion(id: string, weekIndex: number, dayIndex: number): Promise<StudySchedule> {
    const res = await api.patch(`/study-schedules/${id}/toggle-day`, { weekIndex, dayIndex });
    return unwrapData(res);
  },

  async replaceWeeks(id: string, weeks: ScheduleWeek[]): Promise<StudySchedule> {
    const res = await api.put(`/study-schedules/${id}/weeks`, { weeks });
    return unwrapData(res);
  },

  async deleteSchedule(id: string): Promise<void> {
    await api.delete(`/study-schedules/${id}`);
  },
};
