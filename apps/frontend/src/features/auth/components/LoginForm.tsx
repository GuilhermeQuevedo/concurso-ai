import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';
import { useAuth } from '../hooks/useAuth';
import { GoogleAuthButton } from './GoogleAuthButton';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const isAstryxAuth = isFeatureEnabled('ASTRYX_AUTH');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const processedGoogleAuth = useRef(false);

  // Processa retorno do OAuth Google se redirecionado
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const authError = searchParams.get('error');

    if (authError) {
      setError(decodeURIComponent(authError));
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (googleAuth === 'success' && accessToken && refreshToken && !processedGoogleAuth.current) {
      processedGoogleAuth.current = true;

      // Limpa os parâmetros da URL imediatamente para evitar reprocessamento ou loop
      searchParams.delete('google_auth');
      searchParams.delete('access_token');
      searchParams.delete('refresh_token');
      setSearchParams(searchParams, { replace: true });

      const planParam = searchParams.get('plan');
      const targetDestination = planParam ? `/dashboard?subscribe=${planParam}` : (from === '/login' ? '/dashboard' : from);

      loginWithTokens(accessToken, refreshToken)
        .then(() => {
          navigate(targetDestination, { replace: true });
        })
        .catch((err: unknown) => {
          const apiMessage =
            (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
            'Falha ao processar login com o Google.';
          setError(apiMessage);
          processedGoogleAuth.current = false;
        });
    }
  }, [searchParams, setSearchParams, loginWithTokens, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data.email, data.password);
      const planParam = searchParams.get('plan');
      if (planParam) {
        navigate(`/dashboard?subscribe=${planParam}`, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'E-mail ou senha inválidos';
      setError(apiMessage);
    }
  };

  const planParam = searchParams.get('plan');
  const planLabel = planParam === 'yearly' ? 'Plano Anual' : planParam === 'semestral' ? 'Plano Semestral' : planParam === 'monthly' ? 'Plano Mensal' : null;

  return (
    <div className="space-y-5">
      {planLabel && (
        <div className="rounded-xl border border-hairline bg-[var(--color-surface-elevated-2)] p-3.5 text-xs text-[var(--color-text-primary)]">
          <div className="flex items-center gap-2 font-bold mb-1 text-[var(--color-brand)]">
            <Sparkles className="h-4 w-4 stroke-[1.75px]" />
            <span>Assinatura Engrama Pro ({planLabel})</span>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Faça login para prosseguir diretamente ao pagamento seguro com ativação imediata.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Botão de Login com Google */}
      <GoogleAuthButton label="Entrar com o Google" state="login" onError={setError} />

      {/* Divisor */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-canvas)] px-2 text-[var(--color-text-tertiary)]">
            ou continue com e-mail
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={
              isAstryxAuth
                ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            }
            placeholder="seu@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)]">
              Senha
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[var(--color-brand)] hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={
                isAstryxAuth
                  ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                  : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              }
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password.message}</p>}
        </div>

        {isAstryxAuth ? (
          <div className="cursor-pointer pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              label="Entrar"
              isLoading={isSubmitting}
              className="w-full cursor-pointer flex justify-center font-bold"
            />
          </div>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Entrar
          </button>
        )}

        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Não tem conta?{' '}
          <Link to={planParam ? `/register?plan=${planParam}` : '/register'} className="font-semibold text-[var(--color-brand)] hover:underline">
            Cadastre-se
          </Link>
        </p>

        <div className="border-t border-hairline pt-3 text-center">
          <Link
            to="/landing"
            className="text-xs font-semibold text-[var(--color-brand)] hover:underline"
          >
            Conhecer Planos & Assinatura Engrama Pro →
          </Link>
        </div>
      </form>
    </div>
  );
}
