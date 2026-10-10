import { EngramaLogo } from './EngramaLogo';

// Wordmark: o ícone do E + "ngrama", formando "Engrama" com o E da logo.
export function EngramaWordmark({
  logoClass = 'h-8 w-8',
  textClass = 'text-xl',
  className = '',
}: {
  logoClass?: string;
  textClass?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <EngramaLogo className={`${logoClass} shrink-0`} />
      <span className={`font-bold tracking-tight ${textClass}`}>ngrama</span>
    </span>
  );
}
