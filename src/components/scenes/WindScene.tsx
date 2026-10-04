import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 03 — ветер. Слова по одному, между ними много воздуха. */
export function WindScene() {
  const { active, forced } = useScene();
  const [lead, one, two, three] = useSequence(4, active, {
    start: 700,
    step: 1750,
    forced,
  });

  return (
    <Scene index={2} screens={sceneScreens[2]} label={site.scenes.wind}>
      <Reveal as="p" show={lead} className={s.soft}>
        {site.wind.lead}
      </Reveal>
      <div className={s.words}>
        {[one, two, three].map((show, i) => (
          <Reveal key={site.wind.words[i]} as="p" show={show} className={s.word}>
            {site.wind.words[i]}
          </Reveal>
        ))}
      </div>
    </Scene>
  );
}