import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  getFloatingLayoutSnapshot,
  subscribeFloatingLayout,
  saveFloatingLayout,
  clampPosition,
  clampDimension,
  MIN_WIDTH,
  MAX_WIDTH,
  MIN_HEIGHT,
  MAX_HEIGHT,
  DEFAULT_COMPACT_WIDTH,
  DEFAULT_COMPACT_HEIGHT,
  DEFAULT_EXPANDED_WIDTH,
  DEFAULT_EXPANDED_HEIGHT,
} from './floating-layout';

export function useFloatingLayout() {
  const layout = useSyncExternalStore(
    subscribeFloatingLayout,
    getFloatingLayoutSnapshot,
    getFloatingLayoutSnapshot
  );

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Default coordinate calculation when layout.x / y are null (initial run)
  const getDefaultCoordinates = useCallback((width: number, height: number) => {
    if (typeof window === 'undefined') return { x: 300, y: 600 };
    const isDesktop = window.innerWidth >= 1024;
    const defaultX = isDesktop ? Math.min(310, window.innerWidth - width - 24) : 16;
    const defaultY = Math.max(16, window.innerHeight - height - 24);
    return clampPosition(defaultX, defaultY, width, height);
  }, []);

  const currentX = layout.x ?? getDefaultCoordinates(layout.width, layout.height).x;
  const currentY = layout.y ?? getDefaultCoordinates(layout.width, layout.height).y;

  // Handle window resize so floating widget doesn't get pushed offscreen
  useEffect(() => {
    const handleWindowResize = () => {
      const clamped = clampPosition(currentX, currentY, layout.width, layout.height);
      if (clamped.x !== currentX || clamped.y !== currentY) {
        saveFloatingLayout({ x: clamped.x, y: clamped.y });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [currentX, currentY, layout.width, layout.height]);

  // Pointer Drag Handler (Mover para onde quiser)
  const handlePointerDownDrag = useCallback(
    (e: React.PointerEvent) => {
      // Only drag on primary pointer / left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      setIsDragging(true);

      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startX = currentX;
      const startY = currentY;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startPointerX;
        const deltaY = moveEvent.clientY - startPointerY;
        const nextClamped = clampPosition(
          startX + deltaX,
          startY + deltaY,
          layout.width,
          layout.height
        );
        saveFloatingLayout({ x: nextClamped.x, y: nextClamped.y });
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [currentX, currentY, layout.width, layout.height]
  );

  // Pointer Resize Handler (Ajustar largura e altura)
  const handlePointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startWidth = layout.width;
      const startHeight = layout.height;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startPointerX;
        const deltaY = moveEvent.clientY - startPointerY;

        const nextWidth = clampDimension(startWidth + deltaX, MIN_WIDTH, MAX_WIDTH);
        const nextHeight = clampDimension(
          startHeight + deltaY,
          MIN_HEIGHT,
          MAX_HEIGHT,
          window.innerHeight - currentY - 12
        );

        saveFloatingLayout({
          width: nextWidth,
          height: nextHeight,
          isExpanded: nextHeight >= 90,
        });
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [layout.width, layout.height, currentY]
  );

  // Toggle Compact vs Expanded
  const toggleExpand = useCallback(() => {
    if (layout.height >= 90 || layout.isExpanded) {
      // Collapse to compact pill
      saveFloatingLayout({
        width: DEFAULT_COMPACT_WIDTH,
        height: DEFAULT_COMPACT_HEIGHT,
        isExpanded: false,
      });
    } else {
      // Expand to card
      const nextY = Math.max(16, currentY - (DEFAULT_EXPANDED_HEIGHT - DEFAULT_COMPACT_HEIGHT));
      const clamped = clampPosition(
        currentX,
        nextY,
        DEFAULT_EXPANDED_WIDTH,
        DEFAULT_EXPANDED_HEIGHT
      );
      saveFloatingLayout({
        x: clamped.x,
        y: clamped.y,
        width: DEFAULT_EXPANDED_WIDTH,
        height: DEFAULT_EXPANDED_HEIGHT,
        isExpanded: true,
      });
    }
  }, [layout.height, layout.isExpanded, currentX, currentY]);

  return {
    x: currentX,
    y: currentY,
    width: layout.width,
    height: layout.height,
    isExpanded: layout.height >= 90 || layout.isExpanded,
    isDragging,
    isResizing,
    handlePointerDownDrag,
    handlePointerDownResize,
    toggleExpand,
  };
}
