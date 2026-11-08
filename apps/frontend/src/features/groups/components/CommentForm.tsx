import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

const MAX_BODY = 500;

export interface CommentFormProps {
  placeholder: string;
  submitLabel?: string;
  // Quando verdadeiro, mostra a opção "Marcar como dúvida" (só em conversas novas).
  allowDoubt?: boolean;
  defaultDoubt?: boolean;
  pending: boolean;
  onSubmit: (value: { body: string; doubt: boolean }) => void;
}

export function CommentForm({ placeholder, submitLabel = 'Enviar', allowDoubt = false, defaultDoubt = false, pending, onSubmit }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [doubt, setDoubt] = useState(defaultDoubt);
  const trimmed = body.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) return;
        onSubmit({ body: trimmed, doubt });
        setBody('');
      }}
      className="space-y-2"
    >
      <textarea
        value={body}
        maxLength={MAX_BODY}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={2}
        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {allowDoubt ? (
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={doubt} onChange={(e) => setDoubt(e.target.checked)} className="rounded" />
            Marcar como dúvida
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">
            {body.length}/{MAX_BODY}
          </span>
          <button
            type="submit"
            disabled={!trimmed || pending}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
