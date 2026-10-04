import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 02 — Петербург. Главный момент. */
export function PetersburgScene() {
  const { active, forced } = useScene();
  const [lead, tail] = useSequence(2, active, {
    start: 900,
    step: 2100,
    forced,
  });

  return (
    <Scene index={1} screens={sceneScreens[1]} label={site.scenes.petersburg}>
      <Reveal as="p" show={lead} className={s.display}>
        {site.petersburg.lead}
      </Reveal>
      <Reveal as="p" show={tail} className={`${s.display} ${s.displayTall}`}>
        {site.petersburg.tail}
      </Reveal>
    </Scene>
  );
}