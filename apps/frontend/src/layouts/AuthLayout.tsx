import { Brain } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 lg:flex">
        <div className="max-w-md text-center text-white">
          <Brain className="mx-auto mb-6 h-16 w-16" />
          <h1 className="mb-1 text-4xl font-bold">Engrama</h1>
          <p className="mb-4 text-lg font-medium text-primary-100">Onde o estudo vira memória.</p>
          <p className="text-base text-primary-100/90">
            Engrama é a marca que uma experiência grava no cérebro. Aqui, a ciência da memória — repetição espaçada, recordação ativa e elaboração — transforma seu estudo em aprovação.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Brain className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Engrama</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
