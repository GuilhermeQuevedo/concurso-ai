// Termos que não podem aparecer em nicknames. "distinctive" são trechos tão específicos que
// podem ser procurados em qualquer posição; "tokens" só bloqueiam no início, no fim ou como palavra inteira,
// para não barrar palavras comuns (ex.: "computador" contém "puta").
export const DISTINCTIVE_TERMS = [
  'caralho', 'arrombad', 'vagabund', 'desgraca', 'punheta', 'siririca', 'buceta', 'xoxota', 'piroca',
  'cacete', 'cuzao', 'cuzinho', 'escroto', 'retardad', 'pedofil', 'estupr', 'nigger', 'nigga', 'faggot',
  'fuckyou', 'motherfuck', 'hitler', 'nazista', 'crioulo', 'sapatao', 'bicha', 'boiola',
] as const;

export const TOKEN_TERMS = [
  'puta', 'putaria', 'putinha', 'putao', 'puto', 'merda', 'merdinha', 'bosta', 'porra', 'foder', 'fodase', 'fodido', 'foda', 'fdp', 'viado', 'viadinho',
  'otario', 'babaca', 'idiota', 'imbecil', 'cretino', 'tarado', 'cu', 'pau', 'pica', 'rola', 'xereca',
  'nazi', 'kkk', 'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'whore', 'slut', 'retard', 'mongol',
] as const;
