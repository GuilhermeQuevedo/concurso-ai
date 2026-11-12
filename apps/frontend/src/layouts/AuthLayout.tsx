import { Link } from 'react-router';
import { EngramaWordmark } from '@/components/EngramaWordmark';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 lg:flex">
        <div className="max-w-md text-center text-white">
          <EngramaWordmark logoClass="h-14 w-14" textClass="text-5xl" className="mb-4" />
          <p className="mb-4 text-lg font-medium text-primary-100">O que você estuda, fica.</p>
          <p className="text-base text-primary-100/90">
            Engrama é a marca que uma experiência grava no cérebro. Aqui, a ciência da memória — repetição espaçada, recordação ativa e elaboração — transforma seu estudo em aprovação.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md py-8">
          <div className="mb-8 lg:hidden">
            <EngramaWordmark logoClass="h-8 w-8" textClass="text-xl text-gray-900 dark:text-white" />
          </div>

          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>

          {children}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/termos-de-uso" className="hover:text-primary-600 underline">Termos de Uso</Link>
              <span>•</span>
              <Link to="/politica-de-privacidade" className="hover:text-primary-600 underline">Privacidade</Link>
              <span>•</span>
              <Link to="/politica-de-cookies" className="hover:text-primary-600 underline">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
