import { useEffect, useRef, useState } from 'react';

/**
 * Возвращает true, когда элемент заметно держится в кадре.
 * Порог подобран так, чтобы сцена считалась «наступившей»
 * ровно тогда, когда её текст уже стоит по центру экрана.
 */
export function useInView<T extends HTMLElement>(threshold = 0.3): {
  ref: React.RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            setInView(true);
          }
        }
      },
      { threshold: [0, threshold, threshold + 0.25, 1] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}