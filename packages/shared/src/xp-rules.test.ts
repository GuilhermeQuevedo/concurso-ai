import { describe, expect, it } from 'vitest';

import {
  DAILY_XP_CAP,
  costToNextLevel,
  essayXp,
  flashcardXp,
  gameXp,
  grantableXp,
  levelFromXp,
  questionXp,
  sessionBonusXp,
  streakMultiplier,
  tierForLevel,
  xpForLevel,
} from './xp-rules';

describe('XP por ação', () => {
  it('questão certa vale conforme a dificuldade e errada não pontua', () => {
    expect(questionXp('EASY', true)).toBe(3);
    expect(questionXp('MEDIUM', true)).toBe(5);
    expect(questionXp('HARD', true)).toBe(8);
    expect(questionXp('HARD', false)).toBe(0);
  });

  it('bônus de sessão exige 10 questões e 70% de acertos', () => {
    expect(sessionBonusXp(9, 9)).toBe(0);
    expect(sessionBonusXp(10, 6)).toBe(0);
    expect(sessionBonusXp(10, 7)).toBe(10);
    expect(sessionBonusXp(10, 9)).toBe(25);
    expect(sessionBonusXp(20, 18)).toBe(25);
  });

  it('flashcard: acertei 2, em dúvida 1, errei 0', () => {
    expect(flashcardXp(5)).toBe(2);
    expect(flashcardXp(3)).toBe(1);
    expect(flashcardXp(0)).toBe(0);
  });

  it('jogo divide a nota por 5 e redação soma base e nota', () => {
    expect(gameXp(99)).toBe(19);
    expect(gameXp(-5)).toBe(0);
    expect(essayXp(0, 10)).toBe(20);
    expect(essayXp(10, 10)).toBe(50);
    expect(essayXp(5, 10)).toBe(35);
    expect(essayXp(12, 10)).toBe(50);
  });
});

describe('multiplicador da ofensiva', () => {
  it('sobe em 7, 14 e 30 dias', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(6)).toBe(1);
    expect(streakMultiplier(7)).toBe(1.1);
    expect(streakMultiplier(14)).toBe(1.2);
    expect(streakMultiplier(30)).toBe(1.3);
    expect(streakMultiplier(200)).toBe(1.3);
  });
});

describe('tetos diários', () => {
  it('respeita o teto da fonte e o teto total', () => {
    expect(grantableXp('QUESTION', 5, { bySource: { QUESTION: 100 }, total: 100 })).toBe(5);
    expect(grantableXp('QUESTION', 5, { bySource: { QUESTION: 138 }, total: 138 })).toBe(2);
    expect(grantableXp('FLASHCARD', 5, { bySource: { FLASHCARD: 40 }, total: 40 })).toBe(0);
    expect(grantableXp('GAME', 50, { bySource: { GAME: 0 }, total: DAILY_XP_CAP - 10 })).toBe(10);
  });

  it('o bônus de sessão divide o teto com as questões', () => {
    expect(grantableXp('SESSION', 25, { bySource: { QUESTION: 130 }, total: 130 })).toBe(10);
  });

  it('redação não entra no teto diário', () => {
    expect(grantableXp('ESSAY', 50, { bySource: {}, total: DAILY_XP_CAP })).toBe(50);
  });

  it('pedido zero ou negativo não gera XP', () => {
    expect(grantableXp('QUESTION', 0, { bySource: {}, total: 0 })).toBe(0);
    expect(grantableXp('QUESTION', -3, { bySource: {}, total: 0 })).toBe(0);
  });
});

describe('níveis e faixas', () => {
  it('custo de cada nível cresce 25 XP', () => {
    expect(costToNextLevel(1)).toBe(125);
    expect(costToNextLevel(10)).toBe(350);
    expect(costToNextLevel(29)).toBe(825);
  });

  it('XP acumulado bate com o desenho (nível 10 ≈ 2.025, nível 30 ≈ 13.775)', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(10)).toBe(2025);
    expect(xpForLevel(30)).toBe(13775);
  });

  it('calcula nível, progresso e faixa a partir do XP total', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(124).level).toBe(1);
    expect(levelFromXp(125).level).toBe(2);
    const mid = levelFromXp(xpForLevel(10) + 100);
    expect(mid.level).toBe(10);
    expect(mid.xpIntoLevel).toBe(100);
    expect(mid.xpForNext).toBe(350);
    expect(mid.tier.name).toBe('Dedicado');
  });

  it('nível máximo é 30 e fica sem próximo nível', () => {
    const max = levelFromXp(999999);
    expect(max.level).toBe(30);
    expect(max.maxed).toBe(true);
    expect(max.progress).toBe(1);
  });

  it('faixas mudam a cada 5 níveis', () => {
    expect(tierForLevel(1).name).toBe('Calouro');
    expect(tierForLevel(4).name).toBe('Calouro');
    expect(tierForLevel(5).name).toBe('Aplicado');
    expect(tierForLevel(15).name).toBe('Veterano');
    expect(tierForLevel(25).name).toBe('Lenda');
    expect(tierForLevel(30).name).toBe('Lenda');
  });
});
