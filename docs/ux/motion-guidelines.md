# Diretrizes e Tokens de Movimento — Engrama

Este documento define o sistema oficial de movimento e microinterações da plataforma Engrama (`apps/frontend`).
Toda animação ou transição no produto deve seguir rigorosamente as regras aqui estabelecidas.

---

## 1. Princípios Norteadores

1. **Movimento com Função**: Todo movimento responde à pergunta: *O que isso comunica ou facilita?* Se não houver resposta clara, a animação não deve existir.
2. **Orçamento por Frequência de Uso**: Ações frequentes recebem animações mínimas e rápidas (ou nenhuma). Ações raras ou de alto significado comportam expressividade calculada.
3. **Acessibilidade Inegociável (WCAG AA)**: Respeito estrito a `prefers-reduced-motion`. Usuários com sensibilidade vestibular recebem transições estáticas ou fades de 0ms.
4. **Performance de 60fps**: Animações restritas exclusivamente a propriedades de composição gráfica (`transform` e `opacity`). É proibido animar `width`, `height`, `top`, `left`, `margin` ou `padding`.
5. **Zero Easing Linear**: Movimentos naturais aceleram e desaceleram. `linear` é estritamente proibido para transições visuais de UI.

---

## 2. Tokens Semânticos de Duração

Disponíveis como variáveis CSS (`tokens.css`), utilitários no Tailwind v4 (`globals.css`) e constantes tipadas (`src/lib/motion.ts`).

| Token CSS | Tailwind Class | Milissegundos | Propósito e Contexto de Uso |
|---|---|---|---|
| `--duration-instant` | `duration-instant` | **80ms** | Microfeedbacks ultra-rápidos: cliques, seleção de alternativas, active states. |
| `--duration-fast` | `duration-fast` | **140ms** | Ações de alta frequência: hover states, toggles, avanço de flashcards, tooltips. |
| `--duration-base` | `duration-base` | **220ms** | Transições padrão do sistema: abas, expansão de accordions, dropdowns, filtros. |
| `--duration-slow` | `duration-slow` | **320ms** | Entradas de elementos de sobreposição: abertura de modais, drawers, toasts. |
| `--duration-deliberate` | `duration-deliberate` | **450ms** | Ações raras de alto significado: conclusão de simulado, conquista de streak, alertas críticos. |

---

## 3. Curvas de Aceleração (Easing)

| Token CSS | Tailwind Class | Valor Bézier | Aplicação |
|---|---|---|---|
| `--ease-standard` | `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Entrada de elementos em tela e transições gerais. Começa rápido e desacelera suavemente. |
| `--ease-exit` | `ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Saída de elementos de tela (fechamento de modal, dismiss de toast). Acelera para fora da vista. |
| `--ease-in-out` | `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Movimento contínuo de um ponto visível para outro ponto visível (tabs deslizantes, carrosséis). |
| `--ease-overshoot` | `ease-overshoot` | `cubic-bezier(0.34, 1.3, 0.64, 1)` | Follow-through controlado (assentamento de modais/drawers ou celebração de metas). Proibido em ações de alta frequência. |

---

## 4. Tabela de Orçamento de Movimento por Frequência

| Nível de Frequência | Ações Típicas | Teto de Duração | Overshoot Permitido? | Squash & Stretch Permitido? |
|---|---|---|---|---|
| **Muito Alta** | Responder alternativa, virar/avaliar flashcard | **150ms** | ❌ Não | ✅ Sim (sutil, scale 0.98) |
| **Alta** | Alternar tabs, filtros, dropdowns, paginação | **220ms** | ❌ Não | ❌ Não |
| **Média** | Abrir/fechar modal de configuração, drawer, toast | **320ms** | ✅ Sim (leve) | ❌ Não |
| **Rara** | Submeter redação, concluir simulado, desbloqueio de conquista | **450ms** | ✅ Sim | ✅ Sim |

---

## 5. Como Utilizar no Código

### Via Classes Tailwind (CSS Nativo)

```tsx
// Botão com feedback instantâneo e escala sutil
<button className="transition-transform duration-instant ease-standard active:scale-[0.98]">
  Confirmar
</button>

// Card de alternativa com transição rápida
<div className="transition-all duration-fast ease-standard hover:border-primary-500">
  Alternativa A
</div>

// Modal com entrada padrão e curva de desaceleração
<div className="animate-in fade-in zoom-in-95 duration-slow ease-standard">
  Conteúdo do Modal
</div>
```

### Via Hook React (`useMotionPreference`)

Para componentes que orquestram estados ou calculam durações via JavaScript:

```tsx
import { useMotionPreference } from '@/hooks/useMotionPreference';

export function FlashcardContainer() {
  const { prefersReducedMotion, getDuration, resolveMotionClass } = useMotionPreference();

  // Retorna 0 se o usuário preferir redução de movimento, ou 140ms normalmente
  const flipDuration = getDuration('fast');

  return (
    <div className={resolveMotionClass('transition-transform duration-fast', 'transition-none')}>
      {/* Conteúdo */}
    </div>
  );
}
```

### Regras de Linting e Revisão de PRs

1. Nunca use durações arbitrárias como `duration-[250ms]`, `duration-300` ou `duration-500`. Utilize os tokens semânticos (`duration-instant`, `duration-fast`, `duration-base`, `duration-slow`, `duration-deliberate`).
2. Nunca use classes de transição sem especificar easing explícito (`ease-standard`, `ease-exit`, `ease-in-out`).
3. Nunca anime propriedades de layout (`width`, `height`, `left`, `margin`). Use `transform: scale()`, `translate()`.
