import { Reveal } from '../Reveal';
import { Scene, useScene } from '../Scene';
import { useScrolledOnce, useSequence } from '../../hooks/useSequence';
import { sceneScreens, site } from '../../content/site';
import s from '../stage.module.css';

/** 01 — темнота, вода, имя. */
export function IntroScene() {
  const { active, forced } = useScene();
  const [eyebrow, title] = useSequence(2, active, {
    start: 1100,
    step: 2800,
    forced,
  });
  const scrolled = useScrolledOnce();

  return (
    <Scene index={0} screens={sceneScreens[0]} label={site.scenes.intro}>
      <Reveal as="p" show={eyebrow} className={s.eyebrow}>
        {site.intro.eyebrow}
      </Reveal>
      <div className={s.rule} data-shown={title ? 'true' : 'false'} />
      <Reveal as="p" show={title} className={s.hero}>
        {site.intro.title}
      </Reveal>
      <p className={s.hint} data-hidden={scrolled ? 'true' : 'false'} aria-hidden="true">
        {site.intro.hint}
      </p>
    </Scene>
  );
}