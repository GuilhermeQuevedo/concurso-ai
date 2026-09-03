import { CheckCircle2, Circle, MinusCircle, XCircle, Calculator } from 'lucide-react';
import type { CaseStudyResult, CaseStudyAspect } from '@/features/essays/services/essay.service';

const SITUATION = {
  correto: { icon: CheckCircle2, color: 'text-green-500', label: 'Correto' },
  parcial: { icon: Circle, color: 'text-yellow-500', label: 'Parcial' },
  incorreto: { icon: XCircle, color: 'text-red-500', label: 'Incorreto' },
  ausente: { icon: MinusCircle, color: 'text-gray-400', label: 'Ausente' },
} as const;

export function CaseStudyResultView({ result }: { result: CaseStudyResult }) {
  const contentPoints = result.aspects.reduce((s, a) => s + a.points, 0);
  const contentMax = result.aspects.reduce((s, a) => s + a.maxPoints, 0);

  return (
    <>
      {result.framing && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">Enquadramento: </span>
          {result.framing}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Correção por aspecto</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Conteúdo: {fmt(contentPoints)}/{fmt(contentMax)}
          </span>
        </div>
        <div className="space-y-3">
          {result.aspects.map((a, i) => (
            <AspectRow key={i} aspect={a} />
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Forma</h4>
          {result.form.strengths && <p className="mb-1 text-xs text-green-700 dark:text-green-400">✓ {result.form.strengths}</p>}
          {result.form.issues && <p className="mb-1 text-xs text-red-600 dark:text-red-400">✗ {result.form.issues}</p>}
          {result.form.deduction > 0 && (
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Desconto de forma: −{fmt(result.form.deduction)}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Penalidades</h4>
          {result.penalties.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhuma penalidade aplicada.</p>
          ) : (
            <ul className="space-y-1">
              {result.penalties.map((p, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-red-600 dark:text-red-400">−{fmt(p.deduction)}</span> {p.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.calculation && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
          <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>{result.calculation}</span>
        </div>
      )}

      {result.feedback.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Recomendações</h3>
          <ol className="space-y-2">
            {result.feedback.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {i + 1}
                </span>
                <span className="pt-0.5">{f}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

function AspectRow({ aspect }: { aspect: CaseStudyAspect }) {
  const s = SITUATION[aspect.situation] ?? SITUATION.ausente;
  const Icon = s.icon;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="mb-1 flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
          {aspect.aspect}
        </span>
        <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
          {fmt(aspect.points)}/{fmt(aspect.maxPoints)}
        </span>
      </div>
      <p className="pl-6 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{aspect.justification}</p>
    </div>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}
