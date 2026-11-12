import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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
      const plan = new URLSearchParams(window.location.search).get('plan');
      navigate(plan ? `/dashboard?subscribe=${plan}` : '/dashboard', { replace: true });
    } catch {
      setError('Erro ao criar conta. E-mail pode já estar em uso.');
    }
  };

  const planParam = new URLSearchParams(window.location.search).get('plan');
  const planLabel = planParam === 'yearly' ? 'Plano Anual' : planParam === 'semestral' ? 'Plano Semestral' : planParam === 'monthly' ? 'Plano Mensal' : null;

  return (
    <div className="space-y-5">
      {planLabel && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Assinatura Engrama Pro ({planLabel})</span>
          </div>
          <p>Crie sua conta para prosseguir diretamente ao pagamento seguro com ativação imediata.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Cadastro com Google */}
      <GoogleAuthButton label="Cadastrar com o Google" state="register" onError={setError} />

      {/* Divisor */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            ou cadastre-se com e-mail
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Seu nome"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="seu@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>
              Telefone <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(opcional)</span>
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="(11) 99999-9999"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Usado apenas para recuperação de conta e avisos críticos. Nunca enviamos marketing sem seu consentimento.
          </p>
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Repita a senha"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Consentimentos LGPD (v1.0) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              {...register('acceptTerms')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <label htmlFor="acceptTerms" className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Li e concordo com os{' '}
              <Link
                to="/termos-de-uso"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
              >
                Termos de Uso (v1.0)
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
          )}

          <div className="flex items-start gap-2">
            <input
              id="acceptPrivacy"
              type="checkbox"
              {...register('acceptPrivacy')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <label htmlFor="acceptPrivacy" className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Li e concordo com a{' '}
              <Link
                to="/politica-de-privacidade"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
              >
                Política de Privacidade (v1.0)
              </Link>
            </label>
          </div>
          {errors.acceptPrivacy && (
            <p className="text-xs text-red-500">{errors.acceptPrivacy.message}</p>
          )}

          {/* Declaração de Maioridade / ECA Digital */}
          <div className="flex items-start gap-2">
            <input
              id="acceptAgeOrGuardian"
              type="checkbox"
              {...register('acceptAgeOrGuardian')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <label htmlFor="acceptAgeOrGuardian" className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Declaro que sou maior de 18 anos ou possuo autorização expressa do meu responsável legal para utilizar a plataforma.
            </label>
          </div>
          {errors.acceptAgeOrGuardian && (
            <p className="text-xs text-red-500">{errors.acceptAgeOrGuardian.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Criar conta
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem conta?{' '}
          <Link to={planParam ? `/login?plan=${planParam}` : '/login'} className="font-medium text-primary-600 hover:text-primary-500">
            Faça login
          </Link>
        </p>
      </form>
    </div>
  );
}
