import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenText, Loader2 } from 'lucide-react';
import { contestService } from '../services/contest.service';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';

export function TopicContent({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['topic-content', itemId],
    queryFn: () => contestService.getTopicContent(itemId),
    enabled: open,
    staleTime: Infinity,
  });

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
      >
        <BookOpenText className="h-3.5 w-3.5" />
        {open ? 'Ocultar conteúdo' : 'Ver conteúdo'}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando material de estudo com IA...
            </div>
          )}
          {isError && (
            <p className="text-xs text-red-500">
              Não foi possível gerar o conteúdo agora. Tente novamente em instantes.
            </p>
          )}
          {data && <SimpleMarkdown text={data.content} />}
        </div>
      )}
    </div>
  );
}
