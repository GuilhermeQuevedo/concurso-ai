import { Loader2 } from 'lucide-react';

/**
 * Banner informativo que sinaliza que partes complementares de um edital extenso estão sendo processadas em background.
 * Utiliza o token Âmbar (#F2A93B) do Astryx para manter coerência visual.
 */
export function ReadingRestBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F2A93B]/40 bg-[#F2A93B]/10 p-4 text-sm text-[#8a5d1b] shadow-2xs dark:border-[#F2A93B]/40 dark:bg-[#F2A93B]/15 dark:text-[#f8c16d]"
    >
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[#F2A93B]" aria-hidden="true" />
      <p className="leading-relaxed">
        Criamos o objetivo inicial com as primeiras páginas e estamos <strong>lendo o restante do documento em segundo plano</strong>. Os tópicos adicionais aparecerão automaticamente sem necessidade de recarregar a tela.
      </p>
    </div>
  );
}
