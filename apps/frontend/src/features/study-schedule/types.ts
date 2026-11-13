export interface ScheduleBlock {
  order: number;
  subject: string;
  type: 'estudo' | 'revisao' | 'questoes' | 'descanso';
  hours: number;
  priority: 'alta' | 'normal' | 'baixa';
  revisionNumber?: string | null;
  cardTarget?: number;
  notes?: string | null;
}

export interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  type: 'estudo' | 'revisao' | 'simulado' | 'descanso' | 'questoes';
  totalHours: number;
  hours?: number;
  subject?: string;
  priority?: string;
  blocks: ScheduleBlock[];
  completed?: boolean;
}

export interface ScheduleWeek {
  weekNumber: number;
  phase: 'base' | 'intensification' | 'revision';
  theme?: string;
  days: ScheduleDay[];
}

export interface StudySchedule {
  id?: string;
  userId?: string;
  user_id?: string;
  examDate: string;
  exam_date?: string;
  dailyHours: number;
  daily_hours?: number;
  subjects: string[];
  schedule: {
    title?: string;
    weeks: ScheduleWeek[];
  };
  hasPerformanceData?: boolean;
  has_performance_data?: boolean;
  contestId?: string | null;
  contest?: { id: string; name: string } | null;
  createdAt?: string;
  created_at?: string;
}

export type ContentKind = 'JOGOS' | 'QUESTOES' | 'FLASHCARDS';
