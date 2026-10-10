import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ApiErr {
  response?: { data?: { error?: { message?: string } } };
}

function errMessage(e: unknown, fallback: string): string {
  return (e as ApiErr)?.response?.data?.error?.message ?? fallback;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white';

export function AccountSecurity({ currentEmail }: { currentEmail: string }) {
  const { refreshProfile } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOk, setEmailOk] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwOk, setPwOk] = useState(false);

  const emailMut = useMutation({
    mutationFn: () => authService.changeEmail({ newEmail: newEmail.trim(), password: emailPassword }),
    onSuccess: async () => {
      setEmailOk(true);
      setNewEmail('');
      setConfirmEmail('');
      setEmailPassword('');
      await refreshProfile();
    },
  });

  const pwMut = useMutation({
    mutationFn: () => authService.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPwOk(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const emailMismatch = !!newEmail && !!confirmEmail && newEmail.trim() !== confirmEmail.trim();
  const canEmail = !!newEmail.trim() && !emailMismatch && !!emailPassword && !emailMut.isPending;

  const pwMismatch = !!newPassword && !!confirmPassword && newPassword !== confirmPassword;
  const pwTooShort = !!newPassword && newPassword.length < 8;
  const canPw = !!currentPassword && !!newPassword && !pwMismatch && !pwTooShort && !pwMut.isPending;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Alterar e-mail</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Novo e-mail</label>
            <input type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailOk(false); }} placeholder={currentEmail} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Confirmar e-mail</label>
            <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="repita o novo e-mail" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Sua senha</label>
            <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="confirme com sua senha" className={inputClass} />
          </div>
          {emailMismatch && <p className="text-xs text-red-500">Os e-mails não coincidem.</p>}
          {emailMut.isError && <p className="text-xs text-red-500">{errMessage(emailMut.error, 'Falha ao alterar e-mail.')}</p>}
          {emailOk && <p className="text-xs text-green-600 dark:text-green-400">E-mail alterado com sucesso.</p>}
          <button onClick={() => emailMut.mutate()} disabled={!canEmail} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {emailMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Alterar e-mail
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Alterar senha</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Senha atual</label>
            <input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwOk(false); }} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nova senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="mínimo 8 caracteres" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Confirmar senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          {pwTooShort && <p className="text-xs text-red-500">A nova senha precisa de ao menos 8 caracteres.</p>}
          {pwMismatch && <p className="text-xs text-red-500">As senhas não coincidem.</p>}
          {pwMut.isError && <p className="text-xs text-red-500">{errMessage(pwMut.error, 'Falha ao alterar a senha.')}</p>}
          {pwOk && <p className="text-xs text-green-600 dark:text-green-400">Senha alterada com sucesso.</p>}
          <button onClick={() => pwMut.mutate()} disabled={!canPw} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {pwMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Alterar senha
          </button>
        </div>
      </div>
    </div>
  );
}
