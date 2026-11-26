import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export interface PresetChoiceCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

/**
 * Card de seleção para editais pré-configurados seguindo o Astryx Design System.
 */
export function PresetChoiceCard({ icon, title, subtitle, onClick }: PresetChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[44px] w-full items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 text-left transition-all duration-fast ease-standard hover:border-[#2E8C82] hover:bg-[#2E8C82]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#2E8C82] dark:hover:bg-[#2E8C82]/10 active:scale-[0.99] touch-manipulation cursor-pointer shadow-2xs"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] transition-colors group-hover:bg-[#2E8C82] group-hover:text-white dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-sm text-slate-600 dark:text-slate-400">{subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
