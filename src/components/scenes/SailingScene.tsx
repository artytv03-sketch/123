import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 04 — парус. */
export function SailingScene() {
  const { active, forced } = useScene();
  const [lead, one, two, three] = useSequence(4, active, {
    start: 800,
    step: 1650,
    forced,
  });

  return (
    <Scene index={3} screens={sceneScreens[3]} label={site.scenes.sailing}>
      <Reveal as="p" show={lead} className={s.soft}>
        {site.sailing.lead}
      </Reveal>
      <div className={s.words}>
        {[one, two, three].map((show, i) => (
          <Reveal
            key={site.sailing.lines[i]}
            as="p"
            show={show}
            className={`${s.word} ${s.wordSoft}`}
          >
            {site.sailing.lines[i]}
          </Reveal>
        ))}
      </div>
    </Scene>
  );
}