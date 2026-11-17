import { Loader2 } from 'lucide-react';

// Aparece enquanto o restante de um documento grande ainda está sendo lido e somado a este edital.
export function ReadingRestBanner() {
  return (
    <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      <p>
        Criamos o edital com as primeiras páginas e estamos <strong>lendo o restante do documento</strong>. Os tópicos novos aparecem aqui sozinhos, sem precisar recarregar.
      </p>
    </div>
  );
}
