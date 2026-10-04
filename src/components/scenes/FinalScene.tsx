import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 06 — финал. Белая ночь. */
export function FinalScene() {
  const { active, forced } = useScene();
  const [lead, tail, note] = useSequence(3, active, {
    start: 900,
    step: 2200,
    forced,
  });

  return (
    <Scene index={5} screens={sceneScreens[5]} label={site.scenes.final}>
      <Reveal as="p" show={lead} className={s.display}>
        {site.final.lead}
      </Reveal>
      <Reveal as="p" show={tail} className={`${s.display} ${s.displayTall}`}>
        {site.final.tail}
      </Reveal>
      <Reveal as="p" show={note} className={s.note}>
        {site.final.note}
      </Reveal>
    </Scene>
  );
}