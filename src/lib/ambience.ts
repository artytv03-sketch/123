/**
 * Процедурный ambient: ветер + вода + еле слышный город.
 * Никаких файлов и никакого autoplay — звук запускается только по клику.
 */

type Ctor = typeof AudioContext;

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private enabled = false;

  get isEnabled(): boolean {
    return this.enabled;
  }

  async toggle(): Promise<boolean> {
    if (this.enabled) {
      this.disable();
      return false;
    }
    await this.enable();
    return this.enabled;
  }

  private async enable(): Promise<void> {
    try {
      if (!this.ctx) {
        const W = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
        const Ctx = W.AudioContext ?? W.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.build(this.ctx);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const now = this.ctx.currentTime;
      this.master?.gain.cancelScheduledValues(now);
      this.master?.gain.setValueAtTime(this.master?.gain.value ?? 0, now);
      this.master?.gain.linearRampToValueAtTime(0.5, now + 2.6);
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  private disable(): void {
    this.enabled = false;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 1.1);
    window.setTimeout(() => {
      if (this.enabled) return;
      this.sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* уже остановлен */
        }
      });
      this.sources = [];
      this.master?.disconnect();
      this.master = null;
      void this.ctx?.suspend();
    }, 1300);
  }

  private noise(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.021 * white) / 1.021;
      data[i] = last * 3.2;
    }
    // мягкий срез, чтобы низ не гудел
    for (let i = 1; i < len; i += 1) data[i] = (data[i] + data[i - 1]) * 0.5;
    return buffer;
  }

  private build(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    const noise = this.noise(ctx, 5);

    const loop = (offset: number): AudioBufferSourceNode => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      src.start(ctx.currentTime, offset);
      this.sources.push(src);
      return src;
    };

    const lfo = (freq: number, depth: number, target: AudioParam): void => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = depth;
      osc.connect(gain).connect(target);
      osc.start();
      this.sources.push(osc);
    };

    // ветер
    const windSrc = loop(0);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    windSrc.connect(windFilter).connect(windGain).connect(master);
    lfo(0.045, 130, windFilter.frequency);
    lfo(0.11, 0.22, windGain.gain);

    // вода
    const waterSrc = loop(1.7);
    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 1150;
    waterFilter.Q.value = 0.55;
    const waterGain = ctx.createGain();
    waterGain.gain.value = 0.15;
    waterSrc.connect(waterFilter).connect(waterGain).connect(master);
    lfo(0.075, 420, waterFilter.frequency);
    lfo(0.13, 0.07, waterGain.gain);

    // далёкий город
    for (const [freq, level] of [
      [51, 0.05],
      [77, 0.03],
      [103, 0.016],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(master);
      osc.start();
      this.sources.push(osc);
      lfo(0.03 + freq / 4000, level * 0.5, g.gain);
    }
  }
}