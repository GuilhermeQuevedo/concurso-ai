const DEFAULT_STYLE = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

const TIER_STYLE: Record<string, string> = {
  Calouro: DEFAULT_STYLE,
  Aplicado: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  Dedicado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Veterano: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Mestre: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Lenda: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function TierBadge({ level, tier }: { level: number; tier: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_STYLE[tier] ?? DEFAULT_STYLE}`}>
      Nv {level} · {tier}
    </span>
  );
}
