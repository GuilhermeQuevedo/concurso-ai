import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { authService } from '@/features/auth/services/auth.service';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.forgotPassword(email.trim());
      setSuccessMessage(response.message);
      if (response.devResetUrl) {
        setDevResetUrl(response.devResetUrl);
      }
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Erro ao processar solicitação. Tente novamente.';
      setError(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Recuperar senha" subtitle="Informe seu e-mail para receber as instruções de recuperação">
      {successMessage ? (
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Verifique sua caixa de entrada</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {successMessage} Caso não encontre em alguns instantes, lembre-se de conferir sua pasta de spam.
            </p>
          </div>

          {devResetUrl && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                🔧 Simulador de E-mail (Modo Desenvolvimento):
              </span>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Como nenhum provedor de e-mail externo está configurado no .env, você pode testar o link gerado diretamente:
              </p>
              <a
                href={devResetUrl}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Abrir tela de redefinição <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              E-mail cadastrado
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="seu@email.com"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando instruções...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
