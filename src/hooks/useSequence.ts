import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface Options {
  /** пауза перед первым появлением, мс */
  start?: number;
  /** интервал между появлениями, мс */
  step?: number;
  /** показать всё немедленно */
  forced?: boolean;
}

/**
 * Медленная очередь появлений внутри сцены.
 * Как только элемент показан — он остаётся показанным,
 * чтобы быстрый скролл туда-обратно не мигал текстом.
 */
export function useSequence(count: number, active: boolean, options: Options = {}): boolean[] {
  const { start = 700, step = 1500, forced = false } = options;
  const reduced = useReducedMotion();
  const timers = useRef<number[]>([]);

  const [shown, setShown] = useState<boolean[]>(() =>
    new Array<boolean>(count).fill(reduced || forced),
  );

  useEffect(() => {
    if (reduced || forced) {
      setShown(new Array<boolean>(count).fill(true));
      return;
    }
    if (!active) return;

    for (let i = 0; i < count; i += 1) {
      const id = window.setTimeout(() => {
        setShown((prev) => {
          if (prev[i]) return prev;
          const next = prev.slice();
          next[i] = true;
          return next;
        });
      }, start + i * step);
      timers.current.push(id);
    }

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [active, count, start, step, forced, reduced]);

  return shown;
}

/** True после первого скролла — чтобы убрать подсказку «листай ↓». */
export function useScrolledOnce(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (scrolled) return;
    const onScroll = (): void => {
      if (window.scrollY > threshold) {
        setScrolled(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrolled, threshold]);

  return scrolled;
}