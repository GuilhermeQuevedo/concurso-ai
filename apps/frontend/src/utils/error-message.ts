const NETWORK_ERROR = 'Network Error';
const NETWORK_ERROR_PT = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';

// O interceptor da API já troca error.message pela mensagem do backend; fora disso, usa o texto padrão.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  return error.message === NETWORK_ERROR ? NETWORK_ERROR_PT : error.message;
}
