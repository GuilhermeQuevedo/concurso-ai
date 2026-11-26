import { useEffect, useRef, useState, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
import type { GraphNode, GraphEdge, UserTopicMastery } from '../types/map.types';
import { getNodeObsidianColors } from '../utils/graphColors';
import { useConstellationSimulation, type SimNode } from '../hooks/useConstellationSimulation';

export interface ConstellationCanvasHandle {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly fitGraph: () => void;
  readonly exportAsImage: () => string | null;
}

export interface ConstellationCanvasProps {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly masteries: Record<string, UserTopicMastery>;
  readonly selectedNodeId: string | null;
  readonly highlightNodeIds: ReadonlySet<string>;
  readonly highlightEdgeIds: ReadonlySet<string>;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onHoverNode?: (nodeId: string | null) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

/**
 * Renderizador de Alta Performance da Visão Constelação (Canvas 2D com Física Maleável d3-force).
 * Estética idêntica ao Obsidian: Nós compactos e esféricos, física elástica viva,
 * conexões sinápticas translúcidas, halos neon de bloom e fundo cósmico profundo.
 */
export const ConstellationCanvas = memo(
  forwardRef<ConstellationCanvasHandle, ConstellationCanvasProps>(function ConstellationCanvas(
    {
      nodes,
      edges,
      masteries,
      selectedNodeId,
      highlightNodeIds,
      highlightEdgeIds,
      onSelectNode,
      onHoverNode,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1.0 });

    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const draggedNodeIdRef = useRef<string | null>(null);
    const dragPointerStartRef = useRef({ x: 0, y: 0 });
    const hoveredNodeIdRef = useRef<string | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // Conecta a simulação elástica maleável
    const handleSimulationTick = useCallback(() => {
      // Re-renderização disparada pelo loop de animação contínuo
    }, []);

    const {
      simNodesRef,
      simLinksRef,
      getNodeAt,
      startDrag,
      updateDrag,
      endDrag,
      reheat,
    } = useConstellationSimulation({
      nodes,
      edges,
      onTick: handleSimulationTick,
    });

    // Ajusta o enquadramento inicial para caber todos os nós com folga e centralização rigorosa
    const fitGraph = useCallback(() => {
      const canvas = canvasRef.current;
      const currentNodes = simNodesRef.current.length > 0 ? simNodesRef.current : nodes;
      if (!canvas || currentNodes.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const width = canvas.clientWidth || rect.width || 800;
      const height = canvas.clientHeight || rect.height || 600;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const n of currentNodes) {
        const nx = typeof n.x === 'number' ? n.x : 0;
        const ny = typeof n.y === 'number' ? n.y : 0;
        if (nx < minX) minX = nx;
        if (nx > maxX) maxX = nx;
        if (ny < minY) minY = ny;
        if (ny > maxY) maxY = ny;
      }

      const graphWidth = maxX - minX || 200;
      const graphHeight = maxY - minY || 200;

      // Folga segura e assimétrica: compensa a barra superior (~56px) e os cartões de satélites/legenda na base (~170px)
      const paddingX = Math.max(260, width * 0.28);
      const paddingY = Math.max(260, height * 0.40);

      const scaleX = (width - paddingX) / graphWidth;
      const scaleY = (height - paddingY) / graphHeight;
      const nextScale = Math.min(2.2, Math.max(0.35, Math.min(scaleX, scaleY)));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Desloca o centro vertical cerca de 48px acima do meio geométrico para evitar sobreposição com cartões inferiores
      const opticalCenterY = height / 2 - 48;

      setTransform({
        x: width / 2 - centerX * nextScale,
        y: opticalCenterY - centerY * nextScale,
        scale: nextScale,
      });
      reheat();
    }, [nodes, reheat, simNodesRef]);

    // Zoom programático com limites
    const zoomIn = useCallback(() => {
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(prev.scale * 1.25, 4.0),
      }));
    }, []);

    const zoomOut = useCallback(() => {
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(prev.scale * 0.8, 0.25),
      }));
    }, []);

    // Exportação em alta resolução como imagem PNG
    const exportAsImage = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn,
        zoomOut,
        fitGraph,
        exportAsImage,
      }),
      [zoomIn, zoomOut, fitGraph, exportAsImage],
    );

    // Enquadramento automático com ResizeObserver para recentralizar com precisão nas dimensões reais
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      fitGraph();

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          fitGraph();
        });
        resizeObserver.observe(canvas);
      }

      const timer = setTimeout(() => {
        fitGraph();
      }, 100);

      return () => {
        if (resizeObserver) resizeObserver.disconnect();
        clearTimeout(timer);
      };
    }, [fitGraph]);

    // Quando um nó é selecionado, garante foco centralizado e desimpedido
    useEffect(() => {
      if (!selectedNodeId) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const currentNodes = simNodesRef.current.length > 0 ? simNodesRef.current : nodes;
      const targetNode = currentNodes.find((n) => n.id === selectedNodeId);
      if (!targetNode || typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number') return;

      const rect = canvas.getBoundingClientRect();
      const width = canvas.clientWidth || rect.width || 800;
      const height = canvas.clientHeight || rect.height || 600;

      // Posição alvo: centro horizontal e zona central-superior (longe dos satélites no rodapé)
      const targetScreenX = width / 2;
      const targetScreenY = height / 2 - 50;

      setTransform((prev) => {
        const curScreenX = prev.x + targetNode.x * prev.scale;
        const curScreenY = prev.y + targetNode.y * prev.scale;
        const dist = Math.hypot(curScreenX - targetScreenX, curScreenY - targetScreenY);

        // Se já estiver visivelmente centrado com folga, evita pulo brusco
        if (dist < 100) return prev;

        return {
          ...prev,
          x: targetScreenX - targetNode.x * prev.scale,
          y: targetScreenY - targetNode.y * prev.scale,
        };
      });
    }, [selectedNodeId, nodes, simNodesRef]);

    // Loop de renderização contínuo do Canvas 2D
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let isMounted = true;

      const render = () => {
        if (!isMounted) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        const isDark = document.documentElement.classList.contains('dark');
        const hasFocus = Boolean(selectedNodeId || hoveredNodeIdRef.current);
        const currentSimNodes = simNodesRef.current;
        const currentSimLinks = simLinksRef.current;
        const nodeMap = new Map<string, SimNode>(currentSimNodes.map((n) => [n.id, n]));

        // 0. Fundo Cósmico Obsidian (Deep Space Nebula)
        const bgGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          20,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.85,
        );
        if (isDark) {
          bgGrad.addColorStop(0, '#0d1527');
          bgGrad.addColorStop(0.5, '#070a14');
          bgGrad.addColorStop(1, '#030509');
        } else {
          bgGrad.addColorStop(0, '#f8fafc');
          bgGrad.addColorStop(0.6, '#f1f5f9');
          bgGrad.addColorStop(1, '#e2e8f0');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Poeira estelar cósmica no dark mode
        if (isDark) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          for (let i = 0; i < 60; i++) {
            const sx = (i * 187.3) % width;
            const sy = (i * 311.7) % height;
            const sr = i % 4 === 0 ? 1.2 : 0.6;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Aplica matriz de transformação (pan e zoom)
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // 1. Desenha arestas (links com física elástica)
        for (const link of currentSimLinks) {
          const srcId = typeof link.source === 'object' ? link.source.id : (link.source as string);
          const tgtId = typeof link.target === 'object' ? link.target.id : (link.target as string);
          const src = nodeMap.get(srcId);
          const tgt = nodeMap.get(tgtId);
          if (!src || !tgt || typeof src.x !== 'number' || typeof tgt.x !== 'number') continue;

          const isHighlighted = !hasFocus || highlightEdgeIds.has(link.id);
          const edgeAlpha = isHighlighted ? (hasFocus ? 0.85 : 0.35) : 0.05;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);

          if (isHighlighted && hasFocus) {
            // Feixe de luz sináptica vibrante
            ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.8)' : 'rgba(2, 132, 199, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Halo suave ao redor da linha
            ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.2)';
            ctx.lineWidth = 5;
            ctx.stroke();
          } else {
            ctx.strokeStyle = isDark
              ? `rgba(148, 163, 184, ${edgeAlpha})`
              : `rgba(100, 116, 139, ${edgeAlpha})`;
            ctx.lineWidth = isHighlighted ? 1.2 : 0.6;
            ctx.setLineDash([]);
            ctx.stroke();
          }
        }

        // 2. Desenha nós compactos Obsidian (5px a 12px)
        for (const node of currentSimNodes) {
          if (typeof node.x !== 'number' || typeof node.y !== 'number') continue;

          const mastery = masteries[node.id];
          const isNotStarted = !mastery || mastery.state === 'NOT_STARTED';
          const score = mastery?.masteryScore ?? 0;
          const dueCards = mastery?.dueFlashcardsCount ?? 0;

          const isHighlighted = !hasFocus || highlightNodeIds.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeIdRef.current === node.id;
          const radius = node.radius;

          ctx.save();
          ctx.globalAlpha = isHighlighted ? 1.0 : 0.18;

          const colors = getNodeObsidianColors(node, score, isNotStarted, isDark);

          // Halo Luminoso Neon (Bloom estilo Obsidian)
          if (colors.isGlowVisible || isSelected || isHovered) {
            const glowMult = isSelected || isHovered ? 2.8 : 1.9;
            const glowRadius = radius * glowMult;
            const glowGrad = ctx.createRadialGradient(
              node.x,
              node.y,
              radius * 0.2,
              node.x,
              node.y,
              glowRadius,
            );
            glowGrad.addColorStop(0, colors.glow);
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Anel âmbar para flashcards vencidos
          if (dueCards > 0) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 3.5, 0, 2 * Math.PI);
            ctx.strokeStyle = '#F2A93B';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();
          }

          // Realce de seleção ativa (borda exterior pulsante)
          if (isSelected || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4.5, 0, 2 * Math.PI);
            ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }

          // Corpo esférico do nó
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

          if (!isNotStarted) {
            const sphereGrad = ctx.createRadialGradient(
              node.x - radius * 0.35,
              node.y - radius * 0.35,
              radius * 0.1,
              node.x,
              node.y,
              radius,
            );
            sphereGrad.addColorStop(0, '#ffffff');
            sphereGrad.addColorStop(0.35, colors.fill);
            sphereGrad.addColorStop(1, colors.stroke);
            ctx.fillStyle = sphereGrad;
          } else {
            ctx.fillStyle = colors.fill;
          }
          ctx.fill();

          ctx.lineWidth = isNotStarted ? 1.5 : 1.2;
          ctx.strokeStyle = colors.stroke;
          if (isNotStarted) {
            ctx.setLineDash([3, 3]);
          } else {
            ctx.setLineDash([]);
          }
          ctx.stroke();

          // Rótulos de texto elegantes com sombra nítida
          const shouldDrawLabel =
            isSelected ||
            isHovered ||
            (isHighlighted && transform.scale >= 0.7) ||
            node.level === 'DISCIPLINE';

          if (shouldDrawLabel) {
            ctx.setLineDash([]);
            const fontSize = node.level === 'DISCIPLINE' ? 11 : 9;
            ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
            ctx.fillText(node.name, node.x, node.y + radius + 4);
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }

        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);

      return () => {
        isMounted = false;
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, [
      masteries,
      transform,
      selectedNodeId,
      highlightNodeIds,
      highlightEdgeIds,
      simNodesRef,
      simLinksRef,
    ]);

    // Converte coordenadas da tela para coordenadas do modelo
    const screenToModel = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return {
          x: (screenX - transform.x) / transform.scale,
          y: (screenY - transform.y) / transform.scale,
        };
      },
      [transform],
    );

    // Manipuladores de Ponteiro (Arrasto elástico do nó vs Pan do Canvas)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const modelCoord = screenToModel(e.clientX, e.clientY);
      const clickedNode = getNodeAt(modelCoord.x, modelCoord.y);

      dragPointerStartRef.current = { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = 'grabbing';
      }

      if (clickedNode) {
        // Arrasta o nó individual com mola maleável
        draggedNodeIdRef.current = clickedNode.id;
        startDrag(clickedNode.id, modelCoord.x, modelCoord.y);
      } else {
        // Pan do cenário inteiro
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      }

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const modelCoord = screenToModel(e.clientX, e.clientY);

      if (draggedNodeIdRef.current) {
        updateDrag(draggedNodeIdRef.current, modelCoord.x, modelCoord.y);
        return;
      }

      if (isPanningRef.current) {
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        }));
        return;
      }

      const hoveredNode = getNodeAt(modelCoord.x, modelCoord.y);
      const nextHoveredId = hoveredNode?.id ?? null;

      // Garante que o cursor se transforme em mãozinha (pointer) ao passar sobre nós
      const canvas = canvasRef.current;
      if (canvas && !draggedNodeIdRef.current && !isPanningRef.current) {
        canvas.style.cursor = nextHoveredId ? 'pointer' : 'grab';
      }

      if (nextHoveredId !== hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = nextHoveredId;
        onHoverNode?.(nextHoveredId);
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const movedDist = Math.hypot(
        e.clientX - dragPointerStartRef.current.x,
        e.clientY - dragPointerStartRef.current.y,
      );

      if (draggedNodeIdRef.current) {
        const draggedId = draggedNodeIdRef.current;
        endDrag(draggedId);
        draggedNodeIdRef.current = null;

        // Se o movimento foi mínimo, foi um clique intencional
        if (movedDist < 6) {
          onSelectNode(draggedId);
        }
      } else if (isPanningRef.current) {
        isPanningRef.current = false;
        if (movedDist < 6) {
          onSelectNode(null);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = hoveredNodeIdRef.current ? 'pointer' : 'grab';
      }

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignora caso o ponteiro já tenha sido liberado
      }
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      setTransform((prev) => {
        const nextScale = Math.min(4.0, Math.max(0.25, prev.scale * zoomFactor));
        const canvas = canvasRef.current;
        if (!canvas) return { ...prev, scale: nextScale };

        const rect = canvas.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const nextX = cursorX - (cursorX - prev.x) * (nextScale / prev.scale);
        const nextY = cursorY - (cursorY - prev.y) * (nextScale / prev.scale);

        return { x: nextX, y: nextY, scale: nextScale };
      });
    };

    return (
      <div className="relative h-full w-full overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          role="application"
          aria-label="Constelação visual do Mapa de Revisão"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
        />
      </div>
    );
  }),
);
