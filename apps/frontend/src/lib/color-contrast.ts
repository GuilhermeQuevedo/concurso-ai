/**
 * Utilitário matemático dependency-free para conversão de OKLCH / sRGB
 * e cálculo de luminância relativa e contraste conforme WCAG 2.1.
 */

export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly alpha?: number;
}

export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha?: number;
}

/**
 * Converte coordenadas OKLCH em componentes RGB lineares (sem correção gamma).
 */
export function oklchToLinearRgb(color: OklchColor): { r: number; g: number; b: number } {
  const hRad = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hRad);
  const b = color.c * Math.sin(hRad);

  const l_ = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = color.l - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.076743477 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: Math.max(0, Math.min(1, rLin)),
    g: Math.max(0, Math.min(1, gLin)),
    b: Math.max(0, Math.min(1, bLin)),
  };
}

/**
 * Converte canal sRGB não-linear (0-255) em valor linear para cálculo de luminância WCAG.
 */
function srgbChannelToLinear(channel255: number): number {
  const c = Math.max(0, Math.min(255, channel255)) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converte string Hexadecimal (#rrggbb ou #rgb) para objeto RGB.
 */
export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b, alpha: 1 };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b, alpha: 1 };
  }
  return { r: 0, g: 0, b: 0, alpha: 1 };
}

/**
 * Calcula a Luminância Relativa (Y) de uma cor conforme WCAG 2.1 (G18).
 * 0.0 = preto absoluto, 1.0 = branco puro.
 */
export function getRelativeLuminance(color: OklchColor | RgbColor): number {
  if ('l' in color) {
    const lin = oklchToLinearRgb(color);
    return 0.2126 * lin.r + 0.7152 * lin.g + 0.0722 * lin.b;
  }
  const rLin = srgbChannelToLinear(color.r);
  const gLin = srgbChannelToLinear(color.g);
  const bLin = srgbChannelToLinear(color.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calcula a Razão de Contraste WCAG 2.1 entre duas cores (1:1 até 21:1).
 */
export function calculateContrastRatio(
  colorA: OklchColor | RgbColor,
  colorB: OklchColor | RgbColor,
): number {
  const lumA = getRelativeLuminance(colorA);
  const lumB = getRelativeLuminance(colorB);

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Verifica se o par atende aos critérios de conformidade WCAG AA.
 * - Texto padrão: ratio >= 4.5:1
 * - Texto grande (>= 18pt ou 14pt bold): ratio >= 3.0:1
 * - Controles interativos (fronteira visual de inputs/botões): ratio >= 3.0:1
 */
export function passesWcagAA(
  foreground: OklchColor | RgbColor,
  background: OklchColor | RgbColor,
  isLargeTextOrControl = false,
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = isLargeTextOrControl ? 3.0 : 4.5;
  return ratio >= threshold;
}
