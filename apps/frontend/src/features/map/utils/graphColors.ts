import type { GraphNode } from '../types/map.types';

export interface NodeThemeColors {
  readonly fill: string;
  readonly stroke: string;
  readonly glow: string;
  readonly hexNumber: number;
  readonly isGlowVisible: boolean;
}

interface DisciplineColorDefinition {
  readonly darkFill: string;
  readonly lightFill: string;
  readonly darkGlow: string;
  readonly lightGlow: string;
  readonly darkStroke: string;
  readonly lightStroke: string;
  readonly hexNumber: number;
}

const DISCIPLINE_PALETTES: Record<string, DisciplineColorDefinition> = {
  ADMINISTRATIVE: {
    darkFill: '#c084fc',
    lightFill: '#9333ea',
    darkGlow: 'rgba(192, 132, 252, 0.45)',
    lightGlow: 'rgba(147, 51, 234, 0.25)',
    darkStroke: '#e879f9',
    lightStroke: '#7e22ce',
    hexNumber: 0xc084fc,
  },
  PENAL: {
    darkFill: '#fb7185',
    lightFill: '#e11d48',
    darkGlow: 'rgba(251, 113, 133, 0.45)',
    lightGlow: 'rgba(225, 29, 72, 0.25)',
    darkStroke: '#fda4af',
    lightStroke: '#be123c',
    hexNumber: 0xfb7185,
  },
  TAX: {
    darkFill: '#fbbf24',
    lightFill: '#d97706',
    darkGlow: 'rgba(251, 191, 36, 0.45)',
    lightGlow: 'rgba(217, 119, 6, 0.25)',
    darkStroke: '#fde68a',
    lightStroke: '#b45309',
    hexNumber: 0xfbbf24,
  },
  CIVIL: {
    darkFill: '#34d399',
    lightFill: '#059669',
    darkGlow: 'rgba(52, 211, 153, 0.45)',
    lightGlow: 'rgba(5, 150, 105, 0.25)',
    darkStroke: '#6ee7b7',
    lightStroke: '#047857',
    hexNumber: 0x34d399,
  },
  DEFAULT: {
    darkFill: '#00f0ff',
    lightFill: '#0284c7',
    darkGlow: 'rgba(0, 240, 255, 0.45)',
    lightGlow: 'rgba(2, 132, 199, 0.25)',
    darkStroke: '#38bdf8',
    lightStroke: '#0369a1',
    hexNumber: 0x00f0ff,
  },
};

function resolveDisciplineKey(nameLower: string): string {
  if (nameLower.includes('adm') || nameLower.includes('poder') || nameLower.includes('servidor') || nameLower.includes('licita')) {
    return 'ADMINISTRATIVE';
  }
  if (nameLower.includes('penal') || nameLower.includes('crime') || nameLower.includes('process')) {
    return 'PENAL';
  }
  if (nameLower.includes('tribut') || nameLower.includes('financ')) {
    return 'TAX';
  }
  if (nameLower.includes('civil') || nameLower.includes('contrato')) {
    return 'CIVIL';
  }
  return 'DEFAULT';
}

/**
 * Paleta Neon e Halo Luminoso estilo Obsidian Graph Groups.
 * Converte tópicos em núcleos de sinapses com brilho de bloom e diferenciação cromática.
 */
export function getNodeObsidianColors(
  node: Pick<GraphNode, 'name'> & Partial<Pick<GraphNode, 'slug'>>,
  score: number,
  isNotStarted: boolean,
  isDark: boolean,
): NodeThemeColors {
  const nameLower = `${node.name} ${node.slug || ''}`.toLowerCase();
  const paletteKey = resolveDisciplineKey(nameLower);
  const def = DISCIPLINE_PALETTES[paletteKey] ?? DISCIPLINE_PALETTES.DEFAULT;

  if (isNotStarted) {
    return {
      fill: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
      stroke: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
      glow: 'rgba(0, 0, 0, 0)',
      hexNumber: isDark ? 0x334155 : 0x94a3b8,
      isGlowVisible: false,
    };
  }

  const isMastered = score >= 75;
  return {
    fill: isDark ? def.darkFill : def.lightFill,
    stroke: isMastered ? '#ffffff' : isDark ? def.darkStroke : def.lightStroke,
    glow: isDark ? def.darkGlow : def.lightGlow,
    hexNumber: def.hexNumber,
    isGlowVisible: true,
  };
}
