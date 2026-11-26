import React, { useState } from 'react';
import { Button, Badge, Card } from '@astryxdesign/core';
import {
  calculateContrastRatio,
  passesWcagAA,
  type OklchColor,
} from '@/lib/color-contrast';
import { Sun, Moon, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Inbox } from 'lucide-react';
import { toast } from '@/components/ui/toast-store';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface SwatchItem {
  readonly label: string;
  readonly role: string;
  readonly oklchStr: string;
  readonly srgbFallback: string;
  readonly oklchObj: OklchColor;
  readonly textOklch: OklchColor;
  readonly isControlBorder?: boolean;
}

const BRAND_SWATCHES: readonly SwatchItem[] = [
  {
    label: 'Brand Verde-Revisão (Engrama)',
    role: 'Cor de marca principal (#2E8C82)',
    oklchStr: 'oklch(0.54 0.088 188)',
    srgbFallback: '#2E8C82',
    oklchObj: { l: 0.54, c: 0.088, h: 188 },
    textOklch: { l: 0.99, c: 0, h: 0 },
  },
  {
    label: 'Brand Glow',
    role: 'Realces, acentos e gradientes (#46A79B)',
    oklchStr: 'oklch(0.66 0.095 188)',
    srgbFallback: '#46A79B',
    oklchObj: { l: 0.66, c: 0.095, h: 188 },
    textOklch: { l: 0.18, c: 0.015, h: 240 },
  },
  {
    label: 'Âmbar Engrama',
    role: 'Destaque e memória (#F2A93B)',
    oklchStr: 'oklch(0.75 0.16 68)',
    srgbFallback: '#F2A93B',
    oklchObj: { l: 0.75, c: 0.16, h: 68 },
    textOklch: { l: 0.18, c: 0.015, h: 240 },
  },
];

const SEMANTIC_SWATCHES: readonly SwatchItem[] = [
  {
    label: 'Sucesso Sólido',
    role: 'Acertos e metas batidas (botões)',
    oklchStr: 'oklch(0.52 0.15 148)',
    srgbFallback: '#15803d',
    oklchObj: { l: 0.52, c: 0.15, h: 148 },
    textOklch: { l: 0.99, c: 0, h: 0 },
  },
  {
    label: 'Erro / Destrutivo',
    role: 'Incorreto ou ação de exclusão',
    oklchStr: 'oklch(0.55 0.20 28)',
    srgbFallback: '#dc2626',
    oklchObj: { l: 0.55, c: 0.20, h: 28 },
    textOklch: { l: 0.99, c: 0, h: 0 },
  },
  {
    label: 'Aviso',
    role: 'Flashcards vencidos hoje',
    oklchStr: 'oklch(0.68 0.16 75)',
    srgbFallback: '#d97706',
    oklchObj: { l: 0.68, c: 0.16, h: 75 },
    textOklch: { l: 0.18, c: 0.015, h: 260 },
  },
  {
    label: 'Info',
    role: 'Dicas e badges informativos',
    oklchStr: 'oklch(0.55 0.14 245)',
    srgbFallback: '#2563eb',
    oklchObj: { l: 0.55, c: 0.14, h: 245 },
    textOklch: { l: 0.99, c: 0, h: 0 },
  },
];

const SINGLE_HUE_MASTERY_SWATCHES: readonly SwatchItem[] = [
  {
    label: '0. Não Iniciado',
    role: 'Borda tracejada + texto explicativo',
    oklchStr: 'oklch(0.35 0.02 195 / 0.5)',
    srgbFallback: 'rgba(30,41,59,0.5)',
    oklchObj: { l: 0.35, c: 0.02, h: 195 },
    textOklch: { l: 0.90, c: 0, h: 0 },
  },
  {
    label: '1. Iniciado (< 40%)',
    role: 'Borda sólida + selo [1/4]',
    oklchStr: 'oklch(0.44 0.07 195)',
    srgbFallback: '#0e6070',
    oklchObj: { l: 0.44, c: 0.07, h: 195 },
    textOklch: { l: 0.99, c: 0, h: 0 },
  },
  {
    label: '2. Em Andamento (40-74%)',
    role: 'Borda sólida reforçada + selo [2/4]',
    oklchStr: 'oklch(0.62 0.12 195)',
    srgbFallback: '#0891b2',
    oklchObj: { l: 0.62, c: 0.12, h: 195 },
    textOklch: { l: 0.12, c: 0, h: 0 },
  },
  {
    label: '3. Dominado (≥ 75%)',
    role: 'Borda contínua branca + halo + selo [Concluído]',
    oklchStr: 'oklch(0.79 0.15 195)',
    srgbFallback: '#06b6d4',
    oklchObj: { l: 0.79, c: 0.15, h: 195 },
    textOklch: { l: 0.10, c: 0, h: 0 },
  },
];

export function DesignLabPage(): React.ReactElement {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Estado da demonstração da Troca com Desfoque (BlurSwap)
  const [activeTab, setActiveTab] = useState<'questoes' | 'estatisticas' | 'flashcards'>('questoes');
  const [isBlurring, setIsBlurring] = useState<boolean>(false);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const handleTabChange = (newTab: 'questoes' | 'estatisticas' | 'flashcards') => {
    if (newTab === activeTab) return;
    setIsBlurring(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsBlurring(false);
    }, 140); // 140ms: orçamento rígido de microtransição
  };

  return (
    <div
      data-astryx-theme="engrama"
      className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)] p-6 md:p-12 transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header do Design Lab */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[var(--color-brand)] text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Engrama UI Design Lab</h1>
              <Badge variant="neutral" label="Astryx v0.7.18" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Ambiente de teste e auditoria da Camada de Tema OKLCH e componentes Astryx.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              label={isDarkMode ? 'Tema Claro' : 'Tema Escuro'}
              onClick={toggleTheme}
            />
            {isDarkMode ? <Moon className="w-5 h-5 text-amber-300" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
        </header>

        {/* Seção 1: Amostras de Cor OKLCH e Auditoria de Contraste WCAG AA */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--color-brand)]" />
              1. Rampa OKLCH & Validação de Contraste WCAG 2.1 AA
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Cálculo de contraste perceptualmente uniforme sem biblioteca externa.
            </p>
          </div>

          {/* Marca */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Identidade de Marca (Cosmic Slate Blue)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BRAND_SWATCHES.map((swatch) => {
                const ratio = calculateContrastRatio(swatch.textOklch, swatch.oklchObj);
                const passes = passesWcagAA(swatch.textOklch, swatch.oklchObj);

                return (
                  <div
                    key={swatch.label}
                    className="p-4 rounded-xl border border-hairline bg-[var(--color-surface-elevated-1)] space-y-3"
                  >
                    <div
                      className="h-16 rounded-lg flex items-center justify-center font-semibold text-sm transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: swatch.oklchStr, color: swatch.textOklch.l > 0.5 ? '#fff' : '#000' }}
                    >
                      Amostra de Texto
                    </div>
                    <div>
                      <div className="font-medium text-sm">{swatch.label}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] font-mono">{swatch.oklchStr}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)] font-mono">sRGB: {swatch.srgbFallback}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs">
                      <span className="font-medium">Ratio: {ratio.toFixed(2)}:1</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${passes ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {passes ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {passes ? 'Passa AA' : 'Reprovado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Semânticas */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Cores Semânticas de Estado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SEMANTIC_SWATCHES.map((swatch) => {
                const ratio = calculateContrastRatio(swatch.textOklch, swatch.oklchObj);
                const passes = passesWcagAA(swatch.textOklch, swatch.oklchObj);

                return (
                  <div
                    key={swatch.label}
                    className="p-4 rounded-xl border border-hairline bg-[var(--color-surface-elevated-1)] space-y-3"
                  >
                    <div
                      className="h-16 rounded-lg flex items-center justify-center font-semibold text-sm transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: swatch.oklchStr, color: swatch.textOklch.l > 0.5 ? '#fff' : '#000' }}
                    >
                      {swatch.role}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{swatch.label}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] font-mono">{swatch.oklchStr}</div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs">
                      <span className="font-medium">Ratio: {ratio.toFixed(2)}:1</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${passes ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {passes ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {passes ? 'Passa AA' : 'Reprovado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escala de Uma Matiz do Mapa */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Escala de Uma Matiz do Mapa de Revisão (Single-Hue Teal H=195)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SINGLE_HUE_MASTERY_SWATCHES.map((swatch) => (
                <div
                  key={swatch.label}
                  className="p-4 rounded-xl border border-hairline bg-[var(--color-surface-elevated-1)] space-y-3"
                >
                  <div
                    className="h-16 rounded-lg flex items-center justify-center font-semibold text-xs text-center p-2"
                    style={{ backgroundColor: swatch.oklchStr, color: swatch.textOklch.l > 0.5 ? '#fff' : '#000' }}
                  >
                    {swatch.role}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{swatch.label}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] font-mono">{swatch.oklchStr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 2: Componentes Nativos do Astryx */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">2. Componentes Astryx Core com Tema Engrama</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Componentes oficiais Meta Astryx estilizados exclusivamente pela nossa camada de tema OKLCH.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Astryx com Botões */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-base">Astryx Button Showcase</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Variantes primárias, secundárias e destrutivas integradas ao sistema de cores.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" label="Primário (Brand)" />
                  <Button variant="secondary" label="Secundário" />
                  <Button variant="destructive" label="Destrutivo" />
                </div>
              </div>
            </Card>

            {/* Card Astryx com Badges */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-base">Astryx Badge Showcase</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Rótulos de status semânticos para questões, revisões e simulados.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral" label="Não Iniciado" />
                  <Badge variant="success" label="92% Domínio" />
                  <Badge variant="error" label="5 Falhas" />
                  <Badge variant="warning" label="Vence Hoje" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Seção 3: Comportamentos Específicos da Especificação Visual */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">3. Comportamentos Visuais Refinados</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Demonstração de Troca em Desfoque (BlurSwap) e Pontas com Máscara (Scroll Masking).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Troca com Desfoque */}
            <div className="p-6 rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Troca com Desfoque (Orçamento: 3px / 140ms)</h3>
                <Badge variant="neutral" label="Microinteração" />
              </div>
              <div className="flex gap-2 p-1 rounded-lg bg-[var(--color-canvas)] border border-hairline">
                {(['questoes', 'estatisticas', 'flashcards'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[var(--color-brand)] text-white shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {tab === 'questoes' ? 'Questões' : tab === 'estatisticas' ? 'Estatísticas' : 'Flashcards'}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-hairline bg-[var(--color-canvas)] min-h-[100px] flex items-center justify-center">
                <div className={`blur-swap-transition ${isBlurring ? 'blur-swap-animating' : ''}`}>
                  {activeTab === 'questoes' && (
                    <div className="text-center space-y-1">
                      <div className="text-lg font-bold">14 Questões Resolvidas</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Meta diária atingida em 78%</div>
                    </div>
                  )}
                  {activeTab === 'estatisticas' && (
                    <div className="text-center space-y-1">
                      <div className="text-lg font-bold">85.4% de Precisão</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">+4.2% comparado à semana anterior</div>
                    </div>
                  )}
                  {activeTab === 'flashcards' && (
                    <div className="text-center space-y-1">
                      <div className="text-lg font-bold">2 Flashcards Vencidos</div>
                      <div className="text-xs text-amber-500 font-medium">Revisão prioritária sugerida</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pontas com Máscara (Scroll Masking) */}
            <div className="p-6 rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Pontas com Máscara (Scroll Fade Mask)</h3>
                <Badge variant="neutral" label="Scroll suave" />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Extremidades esmaecidas via CSS mask indicam conteúdo além da borda sem quebra abrupta.
              </p>

              <div className="relative p-2 bg-[var(--color-canvas)] rounded-xl border border-hairline">
                <div className="overflow-x-auto scroll-mask-x py-2 flex gap-3 no-scrollbar">
                  {[
                    'Direito Constitucional',
                    'Direito Administrativo',
                    'Língua Portuguesa',
                    'Raciocínio Lógico',
                    'Direito Penal',
                    'Direito Processual Penal',
                    'Legislação Especial',
                    'Contabilidade Pública',
                  ].map((subject) => (
                    <span
                      key={subject}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-elevated-2)] border border-hairline"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Feedback Global & Notificações (Fase 3 - Lote 3) */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              4. Feedback Global & Notificações (Fase 3 — Lote 3)
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Componentes Astryx para Toast, Spinner e EmptyState com acessibilidade nativa, pausa no hover e contraste estrito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Toasts */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated-1)] border border-hairline flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Toasts Globais</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
                  Notificações efêmeras com anúncio em LiveRegion para leitores de tela e auto-dismiss.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  label="Disparar Sucesso"
                  onClick={() => toast.success('Revisão de flashcards salva com sucesso!')}
                />
                <Button
                  variant="secondary"
                  label="Disparar Erro"
                  onClick={() => toast.error('Falha ao sincronizar progresso. Tente novamente.')}
                />
              </div>
            </div>

            {/* Spinners */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated-1)] border border-hairline">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Spinners de Carregamento</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Indicadores de atividade com rotação proporcional e tamanhos ópticos padronizados.
              </p>
              <div className="flex items-center justify-around py-2">
                <div className="text-center">
                  <Spinner size="sm" />
                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1">sm</div>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1">md</div>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1">lg</div>
                </div>
                <div className="text-center">
                  <Spinner size="xl" />
                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1">xl</div>
                </div>
              </div>
            </div>

            {/* EmptyState Compact */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated-1)] border border-hairline">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Empty State (Compacto)</h3>
              <EmptyState
                isCompact
                icon={<Inbox className="h-6 w-6 text-[var(--color-text-secondary)]" />}
                title="Caixa de entrada limpa"
                description="Nenhuma tarefa ou notificação pendente."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
