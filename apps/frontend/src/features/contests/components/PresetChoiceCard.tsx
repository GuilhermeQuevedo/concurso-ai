import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface PresetChoiceCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export function PresetChoiceCard({ icon, title, subtitle, onClick }: PresetChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-600"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900 dark:text-white">{title}</span>
        <span className="block text-sm text-gray-600 dark:text-gray-400">{subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
    </button>
  );
}
