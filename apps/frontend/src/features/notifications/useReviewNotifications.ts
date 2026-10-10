import { useEffect } from 'react';
import { flashcardService } from '@/features/flashcards/services/flashcard.service';
import { studyTaskService } from '@/features/calendar/services/study-task.service';

const LAST_NOTIFIED_KEY = 'review-notif-last';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

function supported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function alreadyNotifiedToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  try {
    return localStorage.getItem(LAST_NOTIFIED_KEY) === today;
  } catch {
    return false;
  }
}

async function notifyIfDue(): Promise<void> {
  if (!supported() || Notification.permission !== 'granted' || alreadyNotifiedToday()) return;

  try {
    const [stats, todayTasks] = await Promise.all([
      flashcardService.getStats().catch(() => ({ total: 0, due: 0 })),
      studyTaskService.today().catch(() => []),
    ]);

    const pendingTasks = todayTasks.filter((t) => !t.completed).length;
    if (stats.due === 0 && pendingTasks === 0) return;

    const parts: string[] = [];
    if (stats.due > 0) parts.push(`${stats.due} flashcard(s) para revisar`);
    if (pendingTasks > 0) parts.push(`${pendingTasks} tarefa(s) de hoje`);

    new Notification('Hora de estudar 📚', {
      body: `Você tem ${parts.join(' e ')} no Engrama.`,
    });

    try {
      localStorage.setItem(LAST_NOTIFIED_KEY, new Date().toISOString().slice(0, 10));
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

export function useReviewNotifications(): void {
  useEffect(() => {
    void notifyIfDue();
    const id = window.setInterval(() => void notifyIfDue(), CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}
