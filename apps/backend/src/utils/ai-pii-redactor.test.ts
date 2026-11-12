import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  redactPII,
  redactCPF,
  redactEmail,
  redactPhone,
  redactDocument,
  redactCandidateHeaders,
  redactKnownStudentName,
  isValidCPFDigits,
} from './ai-pii-redactor.js';

describe('Minimização de PII nas Chamadas a LLMs (Gap G08 / Art. 6º, III LGPD)', () => {
  describe('isValidCPFDigits (Validação Algorítmica de CPF)', () => {
    it('deve validar CPFs com dígitos verificadores corretos', () => {
      // CPFs válidos de teste
      assert.strictEqual(isValidCPFDigits('52998224725'), true);
      assert.strictEqual(isValidCPFDigits('11144477735'), true);
    });

    it('deve rejeitar sequências inválidas ou números repetidos', () => {
      assert.strictEqual(isValidCPFDigits('11111111111'), false);
      assert.strictEqual(isValidCPFDigits('12345678901'), false);
      assert.strictEqual(isValidCPFDigits('12345'), false);
    });
  });

  describe('redactCPF', () => {
    it('deve redigir CPF formatado padrão 000.000.000-00', () => {
      const input = 'O candidato de CPF 123.456.789-00 realizou a prova dissertativa.';
      const output = redactCPF(input);
      assert.strictEqual(output, 'O candidato de CPF [CPF REDIGIDO] realizou a prova dissertativa.');
    });

    it('deve redigir CPF com prefixo textual mesmo sem pontuação', () => {
      const input = 'Meu CPF: 52998224725 para verificação do cadastro.';
      const output = redactCPF(input);
      assert.strictEqual(output, 'Meu [CPF REDIGIDO] para verificação do cadastro.');
    });

    it('deve redigir número avulso de 11 dígitos se for um CPF válido', () => {
      const input = 'Identificador no cabeçalho 52998224725.';
      const output = redactCPF(input);
      assert.strictEqual(output, 'Identificador no cabeçalho [CPF REDIGIDO].');
    });

    it('NÃO deve redigir anos, leis ou números de estudo que não sejam CPF', () => {
      const input = 'Em 1988 foi promulgada a CF/88 com base na Lei 8.112/1990 e protocolo 20240101999.';
      const output = redactCPF(input);
      assert.strictEqual(output, input);
    });
  });

  describe('redactEmail', () => {
    it('deve redigir endereços de e-mail de alunos em textos e redações', () => {
      const input = 'Para dúvidas contate aluno.concurso@gmail.com ou suporte@engrama.com.br.';
      const output = redactEmail(input);
      assert.strictEqual(output, 'Para dúvidas contate [E-MAIL REDIGIDO] ou [E-MAIL REDIGIDO].');
    });
  });

  describe('redactPhone', () => {
    it('deve redigir telefones e celulares brasileiros com DDD', () => {
      const input = 'Meu WhatsApp é (11) 98765-4321 e fixo (21) 3344-5566.';
      const output = redactPhone(input);
      assert.strictEqual(output, 'Meu WhatsApp é [TELEFONE REDIGIDO] e fixo [TELEFONE REDIGIDO].');
    });

    it('deve redigir telefone com código internacional +55', () => {
      const input = 'Contato internacional: +55 61 91234-5678.';
      const output = redactPhone(input);
      assert.strictEqual(output, 'Contato internacional: [TELEFONE REDIGIDO].');
    });

    it('deve redigir números com rótulo Tel/Contato', () => {
      const input = 'Tel: 98888-0000 para retorno.';
      const output = redactPhone(input);
      assert.strictEqual(output, '[TELEFONE REDIGIDO] para retorno.');
    });
  });

  describe('redactDocument', () => {
    it('deve redigir RG de candidato', () => {
      const input = 'Candidato portador do RG: 12.345.678-9 SSP/SP.';
      const output = redactDocument(input);
      assert.strictEqual(output, 'Candidato portador do [DOCUMENTO REDIGIDO] SSP/SP.');
    });
  });

  describe('redactCandidateHeaders', () => {
    it('deve redigir cabeçalho com nome do candidato', () => {
      const input = 'Nome: Carlos Alberto Silva Santos\nRedação sobre Direitos Fundamentais.';
      const output = redactCandidateHeaders(input);
      assert.strictEqual(output, '[IDENTIFICAÇÃO REDIGIDA]\nRedação sobre Direitos Fundamentais.');
    });

    it('deve redigir assinatura de prova', () => {
      const input = 'Concluo a resposta.\nAssinatura: Mariana Ferreira de Souza';
      const output = redactCandidateHeaders(input);
      assert.strictEqual(output, 'Concluo a resposta.\n[IDENTIFICAÇÃO REDIGIDA]');
    });
  });

  describe('redactKnownStudentName', () => {
    it('deve substituir o nome conhecido do aluno por [ESTUDANTE]', () => {
      const input = 'O estudante Gabriel Narducci redigiu a peça técnica com zelo.';
      const output = redactKnownStudentName(input, 'Gabriel Narducci');
      assert.strictEqual(output, 'O estudante [ESTUDANTE] redigiu a peça técnica com zelo.');
    });
  });

  describe('redactPII (Pipeline Completo)', () => {
    it('deve expurgar múltiplos dados pessoais simultaneamente preservando o conteúdo temático', () => {
      const dirtyEssay = `Nome: Gabriel Narducci da Costa
CPF: 52998224725
Contato: (11) 98765-4321 - gabriel@estudante.com.br
TEMA: O princípio da legalidade administrativa previsto no Art. 37 da Constituição de 1988.
A Administração Pública direta e indireta de qualquer dos Poderes obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.`;

      const cleanEssay = redactPII(dirtyEssay, { studentName: 'Gabriel Narducci' });

      assert.ok(!cleanEssay.includes('52998224725'), 'CPF não pode estar presente');
      assert.ok(!cleanEssay.includes('gabriel@estudante.com.br'), 'E-mail não pode estar presente');
      assert.ok(!cleanEssay.includes('98765-4321'), 'Telefone não pode estar presente');
      assert.ok(!cleanEssay.includes('Gabriel Narducci da Costa'), 'Nome do aluno não pode estar presente');

      assert.ok(cleanEssay.includes('[CPF REDIGIDO]'));
      assert.ok(cleanEssay.includes('[E-MAIL REDIGIDO]'));
      assert.ok(cleanEssay.includes('[TELEFONE REDIGIDO]'));
      assert.ok(cleanEssay.includes('Art. 37 da Constituição de 1988'), 'Texto da matéria deve ser preservado');
    });
  });
});
