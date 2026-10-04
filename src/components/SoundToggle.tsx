import { useEffect, useRef, useState } from 'react';
import { Ambience } from '../lib/ambience';
import { site } from '../content/site';
import s from './soundToggle.module.css';

/** Звук включается только вручную: тихий ветер, вода, далёкий город. */
export function SoundToggle() {
  const ambienceRef = useRef<Ambience | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    ambienceRef.current = new Ambience();
    return () => {
      if (ambienceRef.current?.isEnabled) void ambienceRef.current.toggle();
      ambienceRef.current = null;
    };
  }, []);

  const handle = async (): Promise<void> => {
    const next = await ambienceRef.current?.toggle();
    setOn(Boolean(next));
  };

  return (
    <button
      type="button"
      className={s.toggle}
      data-on={on ? 'true' : 'false'}
      aria-pressed={on}
      aria-label={site.sound.label}
      onClick={handle}
    >
      <span className={s.bars} aria-hidden="true">
        <span className={s.bar} />
        <span className={s.bar} />
        <span className={s.bar} />
      </span>
      {on ? site.sound.off : site.sound.on}
    </button>
  );
}