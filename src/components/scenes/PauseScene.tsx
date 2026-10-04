import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 05 — пауза. Почти пустой экран. */
export function PauseScene() {
  const { active, forced } = useScene();
  const [lead, tail] = useSequence(2, active, {
    start: 900,
    step: 2400,
    forced,
  });

  return (
    <Scene index={4} screens={sceneScreens[4]} label={site.scenes.pause}>
      <Reveal as="p" show={lead} className={s.whisper}>
        {site.pause.lead}
      </Reveal>
      <Reveal as="p" show={tail} className={`${s.display} ${s.medium}`}>
        {site.pause.tail}
      </Reveal>
    </Scene>
  );
}