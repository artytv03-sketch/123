import s from './grain.module.css';

/** Плёночное зерно: почти не видно, но без него картинка мертвеет. */
export function Grain() {
  return <div className={s.grain} aria-hidden="true" />;
}