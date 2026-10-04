import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 07 — подпись. */
export function SignoffScene() {
  const { active, forced } = useScene();
  const [lead, tail, mark] = useSequence(3, active, {
    start: 800,
    step: 1500,
    forced,
  });

  return (
    <Scene index={6} screens={sceneScreens[6]} label={site.scenes.signoff}>
      <Reveal as="p" show={lead} className={s.whisper}>
        {site.signoff.lead}
      </Reveal>
      <Reveal as="p" show={tail} className={s.medium}>
        {site.signoff.tail}
      </Reveal>
      <Reveal as="p" show={mark} className={s.mark} aria-hidden="true">
        {site.signoff.mark}
      </Reveal>
    </Scene>
  );
}