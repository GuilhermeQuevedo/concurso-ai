import { useState, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { useAuth } from './useAuth';

export interface UseDsarResult {
  isExporting: boolean;
  isErasing: boolean;
  error: string | null;
  exportData: (password?: string) => Promise<void>;
  eraseAccount: (password?: string, reason?: string) => Promise<boolean>;
  clearError: () => void;
}

export function useDsar(): UseDsarResult {
  const { logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const exportData = useCallback(async (password?: string) => {
    setIsExporting(true);
    setError(null);
    try {
      const blob = await authService.exportData(password);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'engrama-meus-dados.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errResponse = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      const msg =
        errResponse.response?.data?.error?.message ||
        errResponse.response?.data?.message ||
        'Não foi possível exportar seus dados no momento. Tente novamente mais tarde.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const eraseAccount = useCallback(
    async (password?: string, reason?: string): Promise<boolean> => {
      setIsErasing(true);
      setError(null);
      try {
        await authService.eraseAccount({ password, reason });
        await logout();
        return true;
      } catch (err: unknown) {
        const errResponse = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
        const msg =
          errResponse.response?.data?.error?.message ||
          errResponse.response?.data?.message ||
          'Falha ao solicitar exclusão de conta. Verifique sua senha e tente novamente.';
        setError(msg);
        return false;
      } finally {
        setIsErasing(false);
      }
    },
    [logout],
  );

  return {
    isExporting,
    isErasing,
    error,
    exportData,
    eraseAccount,
    clearError,
  };
}
