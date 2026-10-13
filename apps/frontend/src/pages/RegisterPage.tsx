import { AuthLayout } from '@/layouts/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout title="Criar conta" subtitle="Comece a estudar para suas provas e seleções com IA">
      <RegisterForm />
    </AuthLayout>
  );
}
