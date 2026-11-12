import { toast } from '@/components/ui/toast-store';

export const XP_EVENT = 'xp:awarded';

interface XpAwardPayload {
  granted?: number;
  level?: number;
  leveledUp?: boolean;
  tierName?: string | null;
}

function isAward(value: unknown): value is XpAwardPayload {
  return typeof value === 'object' && value !== null && typeof (value as XpAwardPayload).granted === 'number';
}

// Qualquer resposta da API que traga um "xp" com XP concedido vira aviso na tela e atualiza o card de nível.
export function announceXp(data: unknown): void {
  const award = typeof data === 'object' && data !== null ? (data as { xp?: unknown }).xp : undefined;
  if (!isAward(award) || !award.granted || award.granted <= 0) return;
  toast.success(`+${award.granted} XP`);
  if (award.tierName) toast.success(`Nova faixa: ${award.tierName}! Ganhou +1 escudo de sequência.`);
  else if (award.leveledUp) toast.success(`Você subiu para o nível ${award.level}!`);
  window.dispatchEvent(new Event(XP_EVENT));
}
