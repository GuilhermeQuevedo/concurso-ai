import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: boolean;
  readonly errorMessage?: string;
  readonly helperText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error = false,
      errorMessage,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error || errorMessage);
    const describedBy = hasError
      ? errorId
      : helperText
        ? helperId
        : undefined;

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              // Lei de Fitts & Anti-zoom: text-base no mobile (16px evita zoom automático do iOS), sm:text-sm no desktop
              'flex h-11 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 transition-colors duration-fast ease-standard placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation sm:h-10 sm:min-h-[40px] sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-500',
              leftIcon && 'pl-10',
              (rightIcon || hasError) && 'pr-10',
              hasError &&
                'border-red-500 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:text-red-100',
              className,
            )}
            {...props}
          />
          {hasError ? (
            <div className="pointer-events-none absolute right-3 flex items-center text-red-500">
              <AlertCircle className="size-4" aria-hidden="true" />
            </div>
          ) : rightIcon ? (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {errorMessage ? (
          <p
            id={errorId}
            className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
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
Input.displayName = 'Input';

export { Input };
