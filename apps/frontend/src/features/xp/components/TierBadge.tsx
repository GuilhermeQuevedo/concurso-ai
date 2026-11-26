import { Shield, Sparkles, Award, Crown, Flame } from 'lucide-react';

const DEFAULT_STYLE =
  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

const TIER_CONFIG: Record<
  string,
  { style: string; icon: typeof Shield }
> = {
  Calouro: {
    style: DEFAULT_STYLE,
    icon: Shield,
  },
  Aplicado: {
    style: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800',
    icon: Sparkles,
  },
  Dedicado: {
    style: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    icon: Flame,
  },
  Veterano: {
    style: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    icon: Award,
  },
  Mestre: {
    style: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    icon: Crown,
  },
  Lenda: {
    style: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    icon: Crown,
  },
};

export interface TierBadgeProps {
  level: number;
  tier: string;
}

export function TierBadge({ level, tier }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? { style: DEFAULT_STYLE, icon: Shield };
  const Icon = config.icon;

  return (
    <span
      title={`Faixa de Nível: ${tier} (Nível ${level})`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-2xs transition-all touch-manipulation hover:scale-105 active:scale-95 cursor-default ${config.style}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{`Nv ${level} · ${tier}`}</span>
    </span>
  );
}
