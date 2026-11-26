import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateContrastRatio,
  getRelativeLuminance,
  passesWcagAA,
  hexToRgb,
  type OklchColor,
} from './color-contrast';

describe('Color Contrast & OKLCH WCAG AA Validator', () => {
  it('deve calcular luminância relativa do preto e branco corretamente', () => {
    const white = hexToRgb('#ffffff');
    const black = hexToRgb('#000000');

    assert.strictEqual(Number(getRelativeLuminance(white).toFixed(2)), 1.0);
    assert.strictEqual(Number(getRelativeLuminance(black).toFixed(2)), 0.0);
    assert.strictEqual(calculateContrastRatio(white, black), 21.0);
  });

  describe('Auditoria dos Tokens OKLCH da Especificação Visual (Paleta Original Engrama)', () => {
    // Tokens originais Engrama com contraste calibrado
    const canvasLight: OklchColor = { l: 0.99, c: 0.002, h: 240 };
    const canvasDark: OklchColor = { l: 0.12, c: 0.008, h: 240 };

    const textPrimaryLight: OklchColor = { l: 0.18, c: 0.015, h: 240 };
    const textSecondaryLight: OklchColor = { l: 0.48, c: 0.018, h: 240 };

    const textPrimaryDark: OklchColor = { l: 0.97, c: 0.004, h: 240 };
    const textSecondaryDark: OklchColor = { l: 0.72, c: 0.01, h: 240 };

    const borderControlLight: OklchColor = { l: 0.55, c: 0.015, h: 240 };
    const borderControlDark: OklchColor = { l: 0.68, c: 0.01, h: 240 };

    // Marca Original: Verde-Revisão (#2E8C82 / oklch calibrado para >= 4.5:1 com branco)
    const brandVerdeRevisao: OklchColor = { l: 0.54, c: 0.088, h: 188 };
    const whiteOklch: OklchColor = { l: 0.99, c: 0.0, h: 0 };

    // Para botões sólidos com texto branco (L=0.52 garante >= 4.5:1 WCAG AA)
    const semanticSuccessSolid: OklchColor = { l: 0.52, c: 0.15, h: 148 };
    // Para badges/pills sutis (fundo L=0.60 com texto escuro L=0.20)
    const semanticSuccessBadge: OklchColor = { l: 0.60, c: 0.14, h: 148 };
    const semanticSuccessTextDark: OklchColor = { l: 0.20, c: 0.05, h: 148 };

    const semanticError: OklchColor = { l: 0.55, c: 0.2, h: 28 };
    const semanticInfo: OklchColor = { l: 0.55, c: 0.14, h: 245 };

    it('deve garantir contraste >= 4.5:1 para texto primário claro sobre canvas claro', () => {
      const ratio = calculateContrastRatio(textPrimaryLight, canvasLight);
      assert.ok(ratio >= 7.0, `Ratio obtido: ${ratio} (esperado >= 7.0 AAA)`);
      assert.strictEqual(passesWcagAA(textPrimaryLight, canvasLight), true);
    });

    it('deve garantir contraste >= 4.5:1 para texto primário escuro sobre canvas escuro', () => {
      const ratio = calculateContrastRatio(textPrimaryDark, canvasDark);
      assert.ok(ratio >= 10.0, `Ratio obtido: ${ratio} (esperado >= 10.0 AAA)`);
      assert.strictEqual(passesWcagAA(textPrimaryDark, canvasDark), true);
    });

    it('deve garantir contraste >= 4.5:1 para texto secundário em ambos os modos', () => {
      const ratioLight = calculateContrastRatio(textSecondaryLight, canvasLight);
      const ratioDark = calculateContrastRatio(textSecondaryDark, canvasDark);

      assert.ok(ratioLight >= 4.5, `Ratio light secundário: ${ratioLight}`);
      assert.ok(ratioDark >= 4.5, `Ratio dark secundário: ${ratioDark}`);
      assert.strictEqual(passesWcagAA(textSecondaryLight, canvasLight), true);
      assert.strictEqual(passesWcagAA(textSecondaryDark, canvasDark), true);
    });

    it('deve garantir contraste de controle interativo >= 3:1 (WCAG 1.4.11)', () => {
      const ratioLight = calculateContrastRatio(borderControlLight, canvasLight);
      const ratioDark = calculateContrastRatio(borderControlDark, canvasDark);

      assert.ok(ratioLight >= 3.0, `Ratio controle light: ${ratioLight}`);
      assert.ok(ratioDark >= 3.0, `Ratio controle dark: ${ratioDark}`);
      assert.strictEqual(passesWcagAA(borderControlLight, canvasLight, true), true);
      assert.strictEqual(passesWcagAA(borderControlDark, canvasDark, true), true);
    });

    it('deve garantir contraste >= 4.5:1 para texto branco sobre a cor de marca Verde-Revisão', () => {
      const ratio = calculateContrastRatio(whiteOklch, brandVerdeRevisao);
      assert.ok(ratio >= 4.5, `Ratio brand verde-revisão: ${ratio}`);
      assert.strictEqual(passesWcagAA(whiteOklch, brandVerdeRevisao), true);
    });

    it('deve validar contraste das cores semânticas de sucesso, erro e info', () => {
      const ratioSuccessSolid = calculateContrastRatio(whiteOklch, semanticSuccessSolid);
      const ratioSuccessBadge = calculateContrastRatio(semanticSuccessTextDark, semanticSuccessBadge);
      const ratioError = calculateContrastRatio(whiteOklch, semanticError);
      const ratioInfo = calculateContrastRatio(whiteOklch, semanticInfo);

      assert.ok(ratioSuccessSolid >= 4.5, `Ratio sucesso sólido: ${ratioSuccessSolid}`);
      assert.ok(ratioSuccessBadge >= 4.5, `Ratio sucesso badge: ${ratioSuccessBadge}`);
      assert.ok(ratioError >= 4.5, `Ratio erro: ${ratioError}`);
      assert.ok(ratioInfo >= 4.5, `Ratio info: ${ratioInfo}`);
    });
  });
});
