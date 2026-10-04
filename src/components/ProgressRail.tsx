import { useEffect, useRef } from 'react';
import { getTimeline, subscribeTimeline } from '../lib/timeline';
import s from './progressRail.module.css';

/** Тонкая линия прогресса — единственный навигационный элемент на сайте. */
export function ProgressRail() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    return subscribeTimeline(() => {
      fill.style.transform = `scaleY(${getTimeline().progress.toFixed(4)})`;
    });
  }, []);

  return (
    <div className={s.rail} aria-hidden="true">
      <div ref={fillRef} className={s.fill} />
    </div>
  );
}