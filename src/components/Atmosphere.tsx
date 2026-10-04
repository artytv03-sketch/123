import { useEffect, useRef } from 'react';
import { Atmosphere } from '../lib/atmosphere';
import { useReducedMotion } from '../hooks/useReducedMotion';
import s from './atmosphere.module.css';

/**
 * Единственный фон всего сайта: небо, город, вода, туман.
 * Один canvas на всю страницу — так переходы между сценами
 * остаются непрерывными, как в одной непрерывной съёмке.
 */
export function AtmosphereLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<Atmosphere | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const atmosphere = new Atmosphere(canvas);
    instanceRef.current = atmosphere;
    atmosphere.resize();
    atmosphere.start();

    let pending = 0;
    const onResize = (): void => {
      atmosphere.resize();
      if (atmosphere.isReduced) atmosphere.renderOnce();
    };
    const onVisibility = (): void => {
      if (document.hidden) atmosphere.stop();
      else atmosphere.start();
    };
    const onScroll = (): void => {
      if (!atmosphere.isReduced || pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        atmosphere.renderOnce();
      });
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      if (pending) cancelAnimationFrame(pending);
      atmosphere.stop();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.setReducedMotion(reduced);
  }, [reduced]);

  return (
    <div className={s.root} aria-hidden="true">
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.haze} />
      <div className={s.vignette} />
    </div>
  );
}