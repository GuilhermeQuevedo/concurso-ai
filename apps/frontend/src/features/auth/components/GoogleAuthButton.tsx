import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/auth.service';

interface GoogleAuthButtonProps {
  label?: string;
  state?: 'login' | 'register';
  onError?: (message: string) => void;
}

export function GoogleAuthButton({
  label = 'Continuar com o Google',
  state = 'login',
  onError,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const { url } = await authService.getGoogleAuthUrl(state);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de autenticação do Google não disponível');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Não foi possível conectar ao Google. Verifique a configuração no servidor.';
      onError?.(apiMessage);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{isLoading ? 'Conectando ao Google...' : label}</span>
    </button>
  );
}
