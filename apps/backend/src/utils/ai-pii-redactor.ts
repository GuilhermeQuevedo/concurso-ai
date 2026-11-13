/**
 * Utilitário de Minimização e Sanitização de PII para Provedores de IA (Gap G08 / Art. 6º, III LGPD).
 * Garante que dados pessoais identificáveis (nomes, CPFs, e-mails, telefones, RGs)
 * sejam expurgados ou mascarados antes do envio a APIs de LLMs de terceiros (OpenAI, Gemini, Anthropic, Ollama).
 */

export interface PIIRedactionOptions {
  studentName?: string | null;
}

/**
 * Valida o algoritmo de dígitos verificadores do CPF (módulo 11).
 */
export function isValidCPFDigits(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10], 10);
}

/**
 * Redige números de CPF (formatados ou desformatados com dígitos válidos).
 */
export function redactCPF(text: string): string {
  // 1. CPF explicitamente formatado: 000.000.000-00
  let sanitized = text.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF REDIGIDO]');

  // 2. Prefaciado por rótulo CPF/C.P.F.
  sanitized = sanitized.replace(/\b(?:CPF|C\.P\.F\.)\s*:?\s*\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi, '[CPF REDIGIDO]');
  sanitized = sanitized.replace(/\b(?:CPF|C\.P\.F\.)\s*:?\s*\d{11}\b/gi, '[CPF REDIGIDO]');

  // 3. Sequências avulsas de 11 dígitos que comprovem validação algorítmica de CPF
  sanitized = sanitized.replace(/\b\d{11}\b/g, (match) => {
    return isValidCPFDigits(match) ? '[CPF REDIGIDO]' : match;
  });

  return sanitized;
}

/**
 * Redige endereços de e-mail.
 */
export function redactEmail(text: string): string {
  return text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[E-MAIL REDIGIDO]');
}

/**
 * Redige números de telefone e celular brasileiros.
 */
export function redactPhone(text: string): string {
  // 1. Telefones prefaciados por rótulo (ex: Tel: 98888-0000, Contato: (11) 9999-9999)
  let sanitized = text.replace(
    /\b(?:Tel(?:efone)?|Cel(?:ular)?|Whats(?:App)?|Contato)\s*:\s*(?:\+?[\d().+-][\d\s().+-]{6,}\d)\b/gi,
    '[TELEFONE REDIGIDO]',
  );

  // 2. Formato nacional com DDD e dígitos (com ou sem código de país +55)
  sanitized = sanitized.replace(
    /(?:\+55[ \t]?)?(?:\(?\b[1-9]{2}\)?[ \t]?)(?:9[ \t]?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g,
    '[TELEFONE REDIGIDO]',
  );

  return sanitized;
}

/**
 * Redige menções a documentos de identidade (RG / Registro Geral).
 */
export function redactDocument(text: string): string {
  return text.replace(
    /\b(?:RG|R\.G\.|Identidade)\s*(?:n[º°.]?)?\s*:?\s*\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi,
    '[DOCUMENTO REDIGIDO]',
  );
}

/**
 * Redige cabeçalhos e declarações explícitas de identificação de autoria em redações/respostas.
 */
export function redactCandidateHeaders(text: string): string {
  // Padrão de nome próprio brasileiro na mesma linha (suporta conectivos como de, da, do, dos, e)
  const namePattern = '[A-ZÀ-Ú][a-zà-ú]+(?:[ \\t]+(?:de|da|do|dos|das|e|[A-ZÀ-Ú][a-zà-ú]+))+';

  // 1. Cabeçalhos rotulados: Nome: Fulano de Tal, Assinatura: Beltrano, Aluno: Ciclano
  let sanitized = text.replace(
    new RegExp(`\\b(?:Nome|Aluno\\(a\\)?|Candidato\\(a\\)?|Assinatura|Estudante|Autor\\(a\\)?)\\s*:\\s*(${namePattern})`, 'g'),
    '[IDENTIFICAÇÃO REDIGIDA]',
  );

  // 2. Fechamentos e declarações de autoria: "assinada por Fulano de Tal", "assinado por..."
  sanitized = sanitized.replace(
    new RegExp(`\\b(?:assinad[oa]\\s+por|escrit[oa]\\s+por)\\s+(${namePattern})`, 'gi'),
    '[IDENTIFICAÇÃO REDIGIDA]',
  );

  return sanitized;
}

/**
 * Redige o nome do estudante logado caso fornecido em contexto.
 */
export function redactKnownStudentName(text: string, studentName?: string | null): string {
  if (!studentName || studentName.trim().length < 3) return text;
  const trimmed = studentName.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return text.replace(regex, '[ESTUDANTE]');
}

/**
 * Pipeline unificado de sanitização de texto para envio a LLMs.
 */
export function redactPII(text: string, options?: PIIRedactionOptions): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  result = redactCPF(result);
  result = redactEmail(result);
  result = redactPhone(result);
  result = redactDocument(result);
  result = redactCandidateHeaders(result);

  if (options?.studentName) {
    result = redactKnownStudentName(result, options.studentName);
  }

  return result;
}
