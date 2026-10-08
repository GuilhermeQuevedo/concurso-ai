import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { TourContext, markTourDone } from './useTour';
import { TOUR_STEPS } from './tourSteps';
import { TourOverlay } from './TourOverlay';

function visibleInScrollParents(el: HTMLElement): boolean {
  const er = el.getBoundingClientRect();
  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|hidden)/.test(style.overflowY)) {
      const nr = node.getBoundingClientRect();
      if (er.top < nr.top || er.bottom > nr.bottom) return false;
    }
    node = node.parentElement;
  }
  return true;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setRect(null);
    markTourDone();
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        stop();
        return i;
      }
      return i + 1;
    });
  }, [stop]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[index];
    const needsNav = step.path && location.pathname !== step.path;
    if (needsNav) navigate(step.path as string);

    if (step.placement === 'center' || !step.selector) {
      setRect(null);
      return;
    }

    let findTries = 0;
    let scrollTries = 0;
    const measure = () => {
      const selector = step.selector as string;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        if (findTries++ < 25) timers.current.push(setTimeout(measure, 120));
        else setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const inWindow =
        r.top >= 8 && r.bottom <= window.innerHeight - 8 && r.left >= 0 && r.right <= window.innerWidth;
      if ((inWindow && visibleInScrollParents(el)) || scrollTries >= 8) {
        setRect(el.getBoundingClientRect());
        return;
      }
      scrollTries++;
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
      timers.current.push(setTimeout(measure, 90));
    };
    const first = setTimeout(measure, needsNav ? 400 : 60);
    timers.current.push(first);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [active, index, location.pathname, navigate]);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[index];
    if (!step.selector) return;
    const reposition = () => {
      const el = document.querySelector(step.selector as string) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [active, index]);

  return (
    <TourContext.Provider value={{ active, start, stop }}>
      {children}
      {active && (
        <TourOverlay
          step={TOUR_STEPS[index]}
          rect={rect}
          index={index}
          total={TOUR_STEPS.length}
          onPrev={prev}
          onNext={next}
          onSkip={stop}
        />
      )}
    </TourContext.Provider>
  );
}
