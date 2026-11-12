import { DISTINCTIVE_TERMS, TOKEN_TERMS } from './offensive-terms.js';

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
const PREFIX_MIN_LENGTH = 5;

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function wordIsOffensive(word: string): boolean {
  return TOKEN_TERMS.some((term) => word === term || (term.length >= PREFIX_MIN_LENGTH && word.startsWith(term)));
}

// Para texto livre (comentários): olha palavra por palavra, para não barrar frases normais.
export function containsOffensiveText(text: string): boolean {
  const base = normalize(text);
  const variants = [base, base.replace(/[0134-57@$]/g, (c) => LEET[c] ?? c)];
  return variants.some((variant) => {
    const words = variant.split(/[^a-z]+/).filter(Boolean);
    if (words.some(wordIsOffensive)) return true;
    return words.some((word) => DISTINCTIVE_TERMS.some((term) => word.includes(term)));
  });
}
