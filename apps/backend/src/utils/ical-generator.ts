interface ICalEventInput {
  uid: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  durationMinutes?: number;
  isAllDay?: boolean;
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatUtcDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function formatAllDayDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}${month}${day}`;
}

export class ICalGenerator {
  private readonly calendarName: string;
  private readonly events: ICalEventInput[] = [];

  constructor(calendarName = 'Engrama - Cronograma de Estudos') {
    this.calendarName = calendarName;
  }

  addEvent(event: ICalEventInput): this {
    this.events.push(event);
    return this;
  }

  build(): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Engrama//Calendario de Estudos//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeText(this.calendarName)}`,
      'X-WR-TIMEZONE:America/Sao_Paulo',
    ];

    const nowUtc = formatUtcDate(new Date());

    for (const event of this.events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.uid}`);
      lines.push(`DTSTAMP:${nowUtc}`);

      if (event.isAllDay) {
        const dateStr = formatAllDayDate(event.startDate);
        lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
        const nextDay = new Date(event.startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${formatAllDayDate(nextDay)}`);
      } else {
        lines.push(`DTSTART:${formatUtcDate(event.startDate)}`);
        const endDate = event.endDate ?? new Date(event.startDate.getTime() + (event.durationMinutes ?? 30) * 60000);
        lines.push(`DTEND:${formatUtcDate(endDate)}`);
      }

      lines.push(`SUMMARY:${escapeText(event.summary)}`);

      if (event.description) {
        lines.push(`DESCRIPTION:${escapeText(event.description)}`);
      }

      lines.push(`STATUS:${event.status ?? 'CONFIRMED'}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
}
