import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';
import { useAuth } from '../hooks/useAuth';
import { GoogleAuthButton } from './GoogleAuthButton';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim() === '' || /^\+?[1-9]\d{9,14}$/.test(val.replace(/\D/g, '')),
        'Telefone inválido (insira DDD e número válido)',
      ),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Você deve aceitar os Termos de Uso para criar sua conta.' }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'Você deve aceitar a Política de Privacidade para criar sua conta.' }),
    }),
    acceptAgeOrGuardian: z.literal(true, {
      errorMap: () => ({
        message:
          'Você deve confirmar que é maior de 18 anos ou possui autorização expressa do responsável legal.',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const isAstryxAuth = isFeatureEnabled('ASTRYX_AUTH');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerUser(data.name, data.email, data.phone, data.password, {
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
        acceptAgeOrGuardian: data.acceptAgeOrGuardian,
      });
      const planParam = searchParams.get('plan');
      if (planParam) {
        navigate(`/dashboard?subscribe=${planParam}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Erro ao criar conta. Tente novamente.';
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
            Crie sua conta para prosseguir diretamente ao pagamento seguro com ativação imediata.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Botão de Cadastro com Google */}
      <GoogleAuthButton label="Cadastrar com o Google" state="register" onError={setError} />

      {/* Divisor */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-canvas)] px-2 text-[var(--color-text-tertiary)]">
            ou cadastre-se com e-mail
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={
              isAstryxAuth
                ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            }
            placeholder="Seu nome"
          />
          {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name.message}</p>}
        </div>

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
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            Telefone / WhatsApp <span className="text-xs text-[var(--color-text-tertiary)] font-normal">(opcional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            className={
              isAstryxAuth
                ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            }
            placeholder="(11) 99999-9999"
          />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Usado apenas para recuperação de conta e avisos críticos. Nunca enviamos marketing sem seu consentimento.
          </p>
          {errors.phone && <p className="mt-1 text-sm text-rose-500">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className={
                isAstryxAuth
                  ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                  : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              }
              placeholder="Mínimo 8 caracteres"
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

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={
              isAstryxAuth
                ? 'w-full rounded-lg border border-control-interactive bg-[var(--color-surface-elevated-1)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20'
                : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            }
            placeholder="Repita a senha"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-rose-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Consentimentos LGPD (v1.0) — Desmarcados por padrão */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              {...register('acceptTerms')}
              className="mt-0.5 h-4 w-4 rounded border-control-interactive text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-xs text-[var(--color-text-secondary)] leading-tight cursor-pointer">
              Li e concordo com os{' '}
              <Link
                to="/termos-de-uso"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--color-brand)] underline hover:opacity-80"
              >
                Termos de Uso (v1.0)
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-rose-500">{errors.acceptTerms.message}</p>
          )}

          <div className="flex items-start gap-2">
            <input
              id="acceptPrivacy"
              type="checkbox"
              {...register('acceptPrivacy')}
              className="mt-0.5 h-4 w-4 rounded border-control-interactive text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer"
            />
            <label htmlFor="acceptPrivacy" className="text-xs text-[var(--color-text-secondary)] leading-tight cursor-pointer">
              Li e concordo com a{' '}
              <Link
                to="/politica-de-privacidade"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--color-brand)] underline hover:opacity-80"
              >
                Política de Privacidade (v1.0)
              </Link>
            </label>
          </div>
          {errors.acceptPrivacy && (
            <p className="text-xs text-rose-500">{errors.acceptPrivacy.message}</p>
          )}

          {/* Declaração de Maioridade / ECA Digital */}
          <div className="flex items-start gap-2">
            <input
              id="acceptAgeOrGuardian"
              type="checkbox"
              {...register('acceptAgeOrGuardian')}
              className="mt-0.5 h-4 w-4 rounded border-control-interactive text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer"
            />
            <label htmlFor="acceptAgeOrGuardian" className="text-xs text-[var(--color-text-secondary)] leading-tight cursor-pointer">
              Declaro que sou maior de 18 anos ou possuo autorização expressa do meu responsável legal para utilizar a plataforma.
            </label>
          </div>
          {errors.acceptAgeOrGuardian && (
            <p className="text-xs text-rose-500">{errors.acceptAgeOrGuardian.message}</p>
          )}
        </div>

        {isAstryxAuth ? (
          <div className="cursor-pointer pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              label="Criar conta"
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
              <UserPlus className="h-4 w-4" />
            )}
            Criar conta
          </button>
        )}

        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          Já tem conta?{' '}
          <Link to={planParam ? `/login?plan=${planParam}` : '/login'} className="font-semibold text-[var(--color-brand)] hover:underline">
            Faça login
          </Link>
        </p>
      </form>
    </div>
  );
}
