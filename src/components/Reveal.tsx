import type { ElementType, ReactNode } from 'react';
import s from './stage.module.css';

interface RevealProps {
  show: boolean;
  as?: ElementType;
  className?: string;
  delay?: number;
  children: ReactNode;
}

/**
 * Появление «как в кино»: медленный fade, лёгкий подъём и расфокус,
 * который уходит. Никаких bounce и overshoot.
 */
export function Reveal({
  show,
  as = 'p',
  className = '',
  delay = 0,
  children,
}: RevealProps) {
  const Tag = as;
  return (
    <Tag
      data-shown={show ? 'true' : 'false'}
      className={`${s.reveal}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}