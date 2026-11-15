const DAY_MS = 24 * 60 * 60 * 1000;

interface DatedEvent {
  allDayDate?: string;
  start?: Date;
}

const dayOf = (event: DatedEvent): string | null => event.allDayDate ?? (event.start ? event.start.toISOString().slice(0, 10) : null);

// Só os eventos de hoje até `days` dias à frente: o Google tem limite de requisições e o futuro distante pode esperar.
export function withinHorizon<T extends DatedEvent>(events: readonly T[], today: Date, days: number): T[] {
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + days * DAY_MS).toISOString().slice(0, 10);
  return events.filter((event) => {
    const day = dayOf(event);
    return day !== null && day >= from && day <= to;
  });
}
