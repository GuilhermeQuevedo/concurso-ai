import { AuthLayout } from '@/layouts/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout title="Criar conta" subtitle="Comece sua preparação para concursos com IA">
      <RegisterForm />
    </AuthLayout>
  );
}
