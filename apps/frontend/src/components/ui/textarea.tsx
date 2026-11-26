import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly error?: boolean;
  readonly errorMessage?: string;
  readonly helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, errorMessage, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const hasError = Boolean(error || errorMessage);
    const describedBy = hasError
      ? errorId
      : helperText
        ? helperId
        : undefined;

    return (
      <div className="w-full">
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            // Lei de Fitts & Anti-zoom: text-base no mobile (16px), sm:text-sm no desktop
            'flex min-h-[96px] w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors duration-fast ease-standard placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500',
            hasError &&
              'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:text-red-100',
            className,
          )}
          {...props}
        />
        {errorMessage ? (
          <p
            id={errorId}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
