import { DISTINCTIVE_TERMS, TOKEN_TERMS } from './offensive-terms.js';

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 15;
export const NICKNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function desleet(text: string): string {
  return text.replace(/[0134-57@$]/g, (char) => LEET[char] ?? char);
}

export function isValidNicknameFormat(nickname: string): boolean {
  return nickname.length >= NICKNAME_MIN && nickname.length <= NICKNAME_MAX && NICKNAME_PATTERN.test(nickname);
}

// Termos curtos só bloqueiam como palavra inteira; os de 5+ letras também no início ("merdinha").
const PREFIX_MIN_LENGTH = 5;

function matchesToken(token: string): boolean {
  return TOKEN_TERMS.some((term) => token === term || (term.length >= PREFIX_MIN_LENGTH && token.startsWith(term)));
}

export function isOffensiveNickname(nickname: string): boolean {
  const base = stripAccents(nickname).toLowerCase();
  return [base, desleet(base)].some((variant) => {
    const compact = variant.replace(/[_\d]/g, '');
    if (DISTINCTIVE_TERMS.some((term) => compact.includes(term))) return true;
    if (matchesToken(compact)) return true;
    return variant.split(/[_\d]+/).filter(Boolean).some(matchesToken);
  });
}
