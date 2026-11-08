import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface ReminderDTO {
  id: string;
  text: string;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

export interface ReminderChanges {
  text?: string;
  done?: boolean;
  dueDate?: string | null;
}

export const reminderService = {
  async list(): Promise<ReminderDTO[]> {
    const response = await api.get<ApiResponse<ReminderDTO[]>>('/reminders');
    return unwrapData(response);
  },

  async create(input: { text: string; dueDate?: string }): Promise<ReminderDTO> {
    const response = await api.post<ApiResponse<ReminderDTO>>('/reminders', input);
    return unwrapData(response);
  },

  async update(id: string, changes: ReminderChanges): Promise<ReminderDTO> {
    const response = await api.patch<ApiResponse<ReminderDTO>>(`/reminders/${id}`, changes);
    return unwrapData(response);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};
