import { createContext, useContext, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useInView } from '../hooks/useInView';
import s from './stage.module.css';

interface SceneState {
  /** сцена держится в кадре — можно запускать очередь появлений */
  active: boolean;
  /** пользователь пролистал мимо — показываем всё, что осталось */
  forced: boolean;
}

const SceneContext = createContext<SceneState>({ active: false, forced: true });

export function useScene(): SceneState {
  return useContext(SceneContext);
}

interface SceneProps {
  index: number;
  /** высота сцены во вьюпортах */
  screens: number;
  label: string;
  children: ReactNode;
}

/**
 * Одна «кадр» кинематографичной открытки: липкая сцена во весь экран,
 * текст внутри появляется очередью.
 */
export function Scene({ index, screens, label, children }: SceneProps) {
  const { ref, inView } = useInView<HTMLElement>(0.26);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onScroll = (): void => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= window.innerHeight * 0.55) setForced(true);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);

  return (
    <section
      ref={ref}
      data-scene={index}
      aria-label={label}
      className={s.scene}
      style={{ '--screens': screens } as CSSProperties}
    >
      <div className={s.stage}>
        <SceneContext.Provider value={{ active: inView, forced }}>
          <div className={s.block}>{children}</div>
        </SceneContext.Provider>
      </div>
    </section>
  );
}