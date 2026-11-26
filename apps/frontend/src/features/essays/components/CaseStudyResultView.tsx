import { CheckCircle2, Circle, MinusCircle, XCircle, Calculator } from 'lucide-react';
import type { CaseStudyResult, CaseStudyAspect } from '@/features/essays/services/essay.service';

const SITUATION = {
  correto: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    label: 'Correto',
  },
  parcial: {
    icon: Circle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    label: 'Parcial',
  },
  incorreto: {
    icon: XCircle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    label: 'Incorreto',
  },
  ausente: {
    icon: MinusCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    label: 'Ausente',
  },
} as const;

export function CaseStudyResultView({ result }: { result: CaseStudyResult }) {
  const contentPoints = result.aspects.reduce((s, a) => s + a.points, 0);
  const contentMax = result.aspects.reduce((s, a) => s + a.maxPoints, 0);
  const contentPct = contentMax > 0 ? (contentPoints / contentMax) * 100 : 0;

  return (
    <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-normal">
      {result.framing && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Enquadramento Temático
          </h4>
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
            {result.framing}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Correção por Aspecto do Espelho</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avaliação analítica dos quesitos técnicos exigidos</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Conteúdo:</span>
            <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {fmt(contentPoints)} / {fmt(contentMax)} ({Math.round(contentPct)}%)
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {result.aspects.map((a, i) => (
            <AspectRow key={i} aspect={a} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Aspectos Formais & Linguagem</h4>
          {result.form.strengths && (
            <p className="mb-1.5 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
              <span className="font-semibold">✓ Pontos Fortes:</span> {result.form.strengths}
            </p>
          )}
          {result.form.issues && (
            <p className="mb-1.5 text-xs leading-relaxed text-rose-600 dark:text-rose-400">
              <span className="font-semibold">✗ Aprimoramentos:</span> {result.form.issues}
            </p>
          )}
          {result.form.deduction > 0 && (
            <div className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Desconto de forma: −{fmt(result.form.deduction)} ponto(s)
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Penalidades Aplicadas</h4>
          {result.penalties.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma penalidade regulamentar aplicada.</p>
          ) : (
            <ul className="space-y-1.5">
              {result.penalties.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-rose-600 dark:text-rose-400">−{fmt(p.deduction)}</span>
                  <span>{p.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.calculation && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary-200 bg-primary-50/50 p-4 text-xs font-medium text-primary-900 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-200">
          <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
          <span className="font-mono">{result.calculation}</span>
        </div>
      )}

      {result.feedback.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Recomendações Práticas da Banca</h3>
          <ol className="space-y-2.5">
            {result.feedback.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {i + 1}
                </span>
                <span className="pt-0.5">{f}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function AspectRow({ aspect }: { aspect: CaseStudyAspect }) {
  const s = SITUATION[aspect.situation] ?? SITUATION.ausente;
  const Icon = s.icon;
  const pct = aspect.maxPoints > 0 ? (aspect.points / aspect.maxPoints) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 transition-colors dark:border-gray-800 dark:bg-gray-800/40">
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
          {aspect.aspect}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${s.bg}`}>
            {s.label}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {fmt(aspect.points)}/{fmt(aspect.maxPoints)}
          </span>
        </div>
      </div>
      {/* Aspect progress indicator */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-full rounded-full transition-all duration-normal ${
            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{aspect.justification}</p>
    </div>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}
