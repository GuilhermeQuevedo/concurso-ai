import { z } from 'zod';

const level = z.number().int().min(1).max(5);

export const scheduleAvailabilitySchema = z.object({
  subjects: z
    .array(z.object({ name: z.string().trim().min(1).max(200), importance: level, difficulty: level }))
    .max(60),
  days: z
    .array(
      z.object({
        day: z.enum(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']),
        minMinutes: z.number().int().min(0).max(1440),
        maxMinutes: z.number().int().min(0).max(1440),
      }),
    )
    .max(7),
  weeklyGoalMinutes: z.number().int().min(0).max(10080).optional(),
  maxSubjectsPerDay: z.number().int().min(1).max(10).optional(),
});

export type ScheduleAvailability = z.infer<typeof scheduleAvailabilitySchema>;

const DAY_LABELS: Record<string, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
};

export function formatAvailabilityForPrompt(a: ScheduleAvailability): string {
  const lines: string[] = [];
  if (a.subjects.length > 0) {
    lines.push('Matérias (importância e dificuldade de 1 a 5):');
    for (const s of a.subjects) lines.push(`- ${s.name}: importância ${s.importance}, dificuldade ${s.difficulty}`);
  }
  const studyDays = a.days.filter((d) => d.maxMinutes > 0);
  const offDays = a.days.filter((d) => d.maxMinutes === 0).map((d) => DAY_LABELS[d.day]);
  lines.push('Dias e limites de estudo (minutos):');
  for (const d of studyDays) lines.push(`- ${DAY_LABELS[d.day]}: mínimo ${d.minMinutes}, máximo ${d.maxMinutes}`);
  if (offDays.length > 0) lines.push(`Dias SEM estudo: ${offDays.join(', ')}`);
  if (a.weeklyGoalMinutes) lines.push(`Meta semanal: ${Math.round(a.weeklyGoalMinutes / 6) / 10} horas`);
  if (a.maxSubjectsPerDay) lines.push(`Máximo de matérias por dia: ${a.maxSubjectsPerDay}`);
  lines.push('Respeite RIGOROSAMENTE os limites acima. Dê mais tempo às matérias de maior importância e dificuldade.');
  return lines.join('\n');
}
