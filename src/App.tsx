import { useEffect } from 'react';
import { AtmosphereLayer } from './components/Atmosphere';
import { Sailboat } from './components/Sailboat';
import { Grain } from './components/Grain';
import { ProgressRail } from './components/ProgressRail';
import { SoundToggle } from './components/SoundToggle';
import { IntroScene } from './components/scenes/IntroScene';
import { PetersburgScene } from './components/scenes/PetersburgScene';
import { WindScene } from './components/scenes/WindScene';
import { SailingScene } from './components/scenes/SailingScene';
import { PauseScene } from './components/scenes/PauseScene';
import { FinalScene } from './components/scenes/FinalScene';
import { SignoffScene } from './components/scenes/SignoffScene';
import { measureScenes, requestTimelineUpdate } from './lib/timeline';

export default function App() {
  useEffect(() => {
    measureScenes();

    const onScroll = (): void => requestTimelineUpdate();
    const onResize = (): void => measureScenes();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('load', onResize);

    // шрифты и мобильные адресные bar меняют высоту страницы
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(document.documentElement);
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(onResize).catch(() => undefined);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('load', onResize);
      ro?.disconnect();
    };
  }, []);

  return (
    <>
      <AtmosphereLayer />
      <Sailboat />

      <main>
        <h1 className="sr-only">Кристина, Питер тебе к лицу</h1>
        <IntroScene />
        <PetersburgScene />
        <WindScene />
        <SailingScene />
        <PauseScene />
        <FinalScene />
        <SignoffScene />
      </main>

      <Grain />
      <ProgressRail />
      <SoundToggle />
    </>
  );
}