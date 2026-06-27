import { Brain } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 lg:flex">
        <div className="max-w-md text-center text-white">
          <Brain className="mx-auto mb-6 h-16 w-16" />
          <h1 className="mb-3 text-4xl font-bold">Concurso AI</h1>
          <p className="text-lg text-primary-100">
            Prepare-se para concursos com inteligência artificial. Questões inéditas, correção detalhada e acompanhamento personalizado.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Brain className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Concurso AI</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
