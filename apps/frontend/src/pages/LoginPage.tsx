import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Faça login para continuar seus estudos">
      <LoginForm />
    </AuthLayout>
  );
}
