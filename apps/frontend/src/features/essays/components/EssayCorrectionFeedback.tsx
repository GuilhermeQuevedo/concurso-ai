import { useState } from 'react';
import { Award, Check, Copy, TrendingUp } from 'lucide-react';
import type { EssayCriteria } from '../services/essay.service';

interface EssayCorrectionFeedbackProps {
  score: number;
  maxScore: number;
  criteria?: EssayCriteria | null;
  feedback?: string | null;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

interface ScoreTier {
  label: string;
  badge: string;
  bg: string;
  text: string;
  bar: string;
}

function getScoreTier(pct: number): ScoreTier {
  if (pct >= 85) {
    return {
      label: 'Excelente desempenho!',
      badge: 'Nível Aprovado',
      bg: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-200',
      bar: 'bg-emerald-600',
    };
  }
  if (pct >= 70) {
    return {
      label: 'Bom trabalho! Em evolução consistente',
      badge: 'Competitivo',
      bg: 'bg-primary-50 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800',
      text: 'text-primary-950 dark:text-primary-200',
      bar: 'bg-primary-600',
    };
  }
  if (pct >= 50) {
    return {
      label: 'Regular — Margem clara para evolução',
      badge: 'Requer Ajustes',
      bg: 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
      text: 'text-amber-950 dark:text-amber-200',
      bar: 'bg-amber-500',
    };
  }
  return {
    label: 'Atenção necessária aos quesitos da banca',
    badge: 'Abaixo do Ponto de Corte',
    bg: 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800',
    text: 'text-rose-950 dark:text-rose-200',
    bar: 'bg-rose-600',
  };
}

export function EssayCorrectionFeedback({
  score,
  maxScore,
  criteria,
  feedback,
}: EssayCorrectionFeedbackProps) {
  const [copied, setCopied] = useState(false);
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const tier = getScoreTier(pct);

  const handleCopy = async () => {
    if (!feedback) return;
    try {
      await navigator.clipboard.writeText(feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const criteriaItems = [
    {
      key: 'cac' as const,
      label: 'CAC — Conteúdo e Atendimento ao Comando',
      description: 'Pertinência temático-jurídica, progressão argumentativa e repertório factual.',
    },
    {
      key: 'ot' as const,
      label: 'OT — Organização Textual & Coesão',
      description: 'Estruturação em parágrafos, conectivos interparágrafos e fluidez discursiva.',
    },
    {
      key: 'dlp' as const,
      label: 'DLP — Domínio da Língua Portuguesa',
      description: 'Correção gramatical, morfossintaxe, regência, pontuação e adequação vocabular.',
    },
  ];

  return (
    <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Score Hero Card */}
      <div className={`rounded-2xl border p-6 text-center shadow-xs transition-colors ${tier.bg}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Award className={`h-5 w-5 ${tier.text}`} />
          <span className="rounded-full bg-white/90 dark:bg-gray-800/90 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-xs">
            {tier.badge}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Nota Final Homologada</p>
        <p className={`mt-1 text-5xl font-extrabold tracking-tight ${tier.text}`}>
          {fmt(score)}
          <span className="text-2xl font-semibold opacity-75">/{maxScore}</span>
        </p>
        <p className={`mt-2 text-sm font-semibold ${tier.text}`}>{tier.label}</p>

        {/* Global score bar */}
        <div className="mt-4 mx-auto max-w-xs h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-full rounded-full transition-all duration-fast ${tier.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Criteria Breakdown */}
      {criteria && 'cac' in criteria && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Critérios Avaliativos da Banca</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Detalhamento por competência padrão concurso</p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary-600" />
          </div>

          <div className="space-y-3.5">
            {criteriaItems.map(({ key, label, description }) => {
              const criterion = criteria[key];
              if (!criterion) return null;
              const critPct = criterion.maxScore > 0 ? (criterion.score / criterion.maxScore) * 100 : 0;
              const barColor =
                critPct >= 75 ? 'bg-emerald-600' : critPct >= 50 ? 'bg-amber-500' : 'bg-rose-600';

              return (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200/70 bg-gray-50/70 p-4 transition-colors dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
                      {fmt(criterion.score)} / {fmt(criterion.maxScore)}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400 leading-snug">{description}</p>
                  <div className="mb-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(critPct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className={`h-full rounded-full transition-all duration-fast ${barColor}`}
                      style={{ width: `${critPct}%` }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900/60 p-3 rounded-lg border border-gray-200/60 dark:border-gray-800">
                    {criterion.comments}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Feedback Comments */}
      {feedback && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Parecer Didático da Banca</h3>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 touch-manipulation cursor-pointer transition-all dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="text-emerald-600 font-bold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Parecer</span>
                </>
              )}
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {feedback}
          </p>
        </div>
      )}
    </div>
  );
}
