import { clamp, lerp, mulberry32, smoothstep } from './random';
import { timeline } from './timeline';

type RGB = [number, number, number];

export interface Look {
  skyTop: RGB;
  skyMid: RGB;
  skyLow: RGB;
  water: RGB;
  /** подсветка горизонта */
  glow: number;
  /** северное сияние */
  aurora: number;
  stars: number;
  cityFar: number;
  cityNear: number;
  lights: number;
  reflections: number;
  waves: number;
  fog: number;
  mist: number;
  wind: number;
  /** линия горизонта, доля высоты канваса */
  horizon: number;
  /** горизонтальный параллакс города */
  pan: number;
  /** сила виньетки */
  vignette: number;
}

const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/**
 * Ключевые кадры атмосферы — по одному на сцену.
 * Значения в 0..1, цвета — холодная палитра Петербурга после дождя.
 */
const LOOKS: Look[] = [
  // 00 — темнота: только вода и почти чёрное небо
  {
    skyTop: hex('#03070B'),
    skyMid: hex('#050B12'),
    skyLow: hex('#071018'),
    water: hex('#03070B'),
    glow: 0.04,
    aurora: 0,
    stars: 0.5,
    cityFar: 0.06,
    cityNear: 0.04,
    lights: 0.06,
    reflections: 0.05,
    waves: 0.35,
    fog: 0.12,
    mist: 0.3,
    wind: 0.02,
    horizon: 0.64,
    pan: 0,
    vignette: 1,
  },
  // 01 — Петербург: силуэт, мост, редкие огни
  {
    skyTop: hex('#050D16'),
    skyMid: hex('#0B1C2A'),
    skyLow: hex('#122431'),
    water: hex('#050B11'),
    glow: 0.24,
    aurora: 0,
    stars: 0.42,
    cityFar: 0.62,
    cityNear: 0.82,
    lights: 0.9,
    reflections: 0.85,
    waves: 0.6,
    fog: 0.3,
    mist: 0.4,
    wind: 0.08,
    horizon: 0.61,
    pan: 0.012,
    vignette: 0.92,
  },
  // 02 — ветер: город тонет в тумане
  {
    skyTop: hex('#060F19'),
    skyMid: hex('#0C1E2C'),
    skyLow: hex('#132634'),
    water: hex('#060D13'),
    glow: 0.26,
    aurora: 0.05,
    stars: 0.3,
    cityFar: 0.3,
    cityNear: 0.34,
    lights: 0.45,
    reflections: 0.45,
    waves: 0.95,
    fog: 0.44,
    mist: 0.62,
    wind: 0.9,
    horizon: 0.59,
    pan: 0.03,
    vignette: 0.85,
  },
  // 03 — парус: вода, туман, почти пустой берег
  {
    skyTop: hex('#06111C'),
    skyMid: hex('#0D2030'),
    skyLow: hex('#162B3A'),
    water: hex('#060E15'),
    glow: 0.3,
    aurora: 0.12,
    stars: 0.26,
    cityFar: 0.18,
    cityNear: 0.16,
    lights: 0.3,
    reflections: 0.35,
    waves: 0.8,
    fog: 0.5,
    mist: 0.52,
    wind: 0.7,
    horizon: 0.57,
    pan: 0.042,
    vignette: 0.78,
  },
  // 04 — пауза: только вода и тёмное небо
  {
    skyTop: hex('#060F19'),
    skyMid: hex('#0C1D2B'),
    skyLow: hex('#142634'),
    water: hex('#050B12'),
    glow: 0.28,
    aurora: 0.2,
    stars: 0.24,
    cityFar: 0.08,
    cityNear: 0.06,
    lights: 0.14,
    reflections: 0.18,
    waves: 0.6,
    fog: 0.62,
    mist: 0.5,
    wind: 0.32,
    horizon: 0.56,
    pan: 0.05,
    vignette: 0.7,
  },
  // 05 — финал: белая ночь, мягкое сияние на горизонте
  {
    skyTop: hex('#09161F'),
    skyMid: hex('#112A3C'),
    skyLow: hex('#1E3C4E'),
    water: hex('#071019'),
    glow: 0.55,
    aurora: 0.62,
    stars: 0.14,
    cityFar: 0.12,
    cityNear: 0.1,
    lights: 0.26,
    reflections: 0.4,
    waves: 0.55,
    fog: 0.52,
    mist: 0.46,
    wind: 0.2,
    horizon: 0.55,
    pan: 0.056,
    vignette: 0.5,
  },
  // 06 — подпись: чуть светлее и спокойнее
  {
    skyTop: hex('#0A1822'),
    skyMid: hex('#122C3E'),
    skyLow: hex('#20404F'),
    water: hex('#08111A'),
    glow: 0.58,
    aurora: 0.5,
    stars: 0.12,
    cityFar: 0.1,
    cityNear: 0.08,
    lights: 0.22,
    reflections: 0.34,
    waves: 0.5,
    fog: 0.56,
    mist: 0.44,
    wind: 0.16,
    horizon: 0.545,
    pan: 0.06,
    vignette: 0.45,
  },
];

const rgb = (c: RGB, a = 1): string =>
  a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Плавно интерполирует «взгляд» между соседними сценами. */
export function sampleLook(x: number): Look {
  const last = LOOKS.length - 1;
  const p = clamp(x, 0, last);
  const i = Math.floor(p);
  const j = Math.min(last, i + 1);
  const t = smoothstep(p - i);
  const a = LOOKS[i];
  const b = LOOKS[j];
  return {
    skyTop: mixRGB(a.skyTop, b.skyTop, t),
    skyMid: mixRGB(a.skyMid, b.skyMid, t),
    skyLow: mixRGB(a.skyLow, b.skyLow, t),
    water: mixRGB(a.water, b.water, t),
    glow: lerp(a.glow, b.glow, t),
    aurora: lerp(a.aurora, b.aurora, t),
    stars: lerp(a.stars, b.stars, t),
    cityFar: lerp(a.cityFar, b.cityFar, t),
    cityNear: lerp(a.cityNear, b.cityNear, t),
    lights: lerp(a.lights, b.lights, t),
    reflections: lerp(a.reflections, b.reflections, t),
    waves: lerp(a.waves, b.waves, t),
    fog: lerp(a.fog, b.fog, t),
    mist: lerp(a.mist, b.mist, t),
    wind: lerp(a.wind, b.wind, t),
    horizon: lerp(a.horizon, b.horizon, t),
    pan: lerp(a.pan, b.pan, t),
    vignette: lerp(a.vignette, b.vignette, t),
  };
}

interface Box {
  x: number;
  /** высота над горизонтом в долях высоты канваса (отрицательная) */
  y: number;
  w: number;
  h: number;
  layer: 0 | 1;
}

interface Light {
  x: number;
  y: number;
  /** размер в долях ширины канваса */
  s: number;
  a: number;
  ph: number;
  reflect: boolean;
  layer: 0 | 1;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  a: number;
  ph: number;
  sp: number;
}

interface Streak {
  y: number;
  len: number;
  sp: number;
  ph: number;
  a: number;
}

interface Glint {
  x: number;
  /** глубина 0 (у горизонта) .. 1 (низ кадра) */
  d: number;
  len: number;
  ph: number;
  a: number;
}

const AMBER: RGB = hex('#D9A25F');
const COLD: RGB = hex('#BFD6E6');

/**
 * Процедурный рендер атмосферы: небо, город, вода, туман.
 * Никаких растровых ассетов — только Canvas 2D.
 */
export class Atmosphere {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private raf = 0;
  private t = 0;
  private low = false;
  private reduced = false;
  private running = false;
  private frameSamples: number[] = [];
  private lastHorizon = -1;
  private lastBoat = -1;

  private far: Box[] = [];
  private near: Box[] = [];
  private lights: Light[] = [];
  private lamps: Light[] = [];
  private mist: Particle[] = [];
  private streaks: Streak[] = [];
  private glints: Glint[] = [];

  private softWarm: HTMLCanvasElement;
  private softCold: HTMLCanvasElement;
  private softTeal: HTMLCanvasElement;
  private softViolet: HTMLCanvasElement;
  private fallWarm: HTMLCanvasElement;
  private fallCold: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D недоступен');
    this.ctx = ctx;

    this.softWarm = this.makeGlow(AMBER, 0.95);
    this.softCold = this.makeGlow(COLD, 0.8);
    this.softTeal = this.makeGlow(hex('#7FE3C4'), 0.55);
    this.softViolet = this.makeGlow(hex('#8FA6E8'), 0.5);
    this.fallWarm = this.makeFalloff(AMBER);
    this.fallCold = this.makeFalloff(COLD);

    const cores = navigator.hardwareConcurrency ?? 8;
    this.low = cores > 0 && cores <= 2;
  }

  /* ---------------------------------------------------------------- sprites */

  private makeGlow(color: RGB, strength: number): HTMLCanvasElement {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, rgb(color, strength));
    grad.addColorStop(0.18, rgb(color, strength * 0.5));
    grad.addColorStop(0.45, rgb(color, strength * 0.16));
    grad.addColorStop(1, rgb(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  /** Мягкий овал: ярче сверху, тает вниз и в стороны — так выглядит отражение огня на воде. */
private makeFalloff(color: RGB): HTMLCanvasElement {
    const w = 64;
    const h = 256;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(w / 2, 8, 0, w / 2, 8, 46);
    grad.addColorStop(0, rgb(color, 0.95));
    grad.addColorStop(0.22, rgb(color, 0.5));
    grad.addColorStop(0.55, rgb(color, 0.16));
    grad.addColorStop(1, rgb(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    return c;
  }

  /* -------------------------------------------------------------- geometry */

  private buildGeometry(): void {
    const rnd = mulberry32(0x5eed1a);
    this.far = [];
    this.near = [];
    this.lights = [];
    this.lamps = [];

    let x = -0.06;
    while (x < 1.06) {
      const w = 0.014 + rnd() * 0.042;
      const tall = rnd() < 0.09;
      const h = (0.01 + rnd() * 0.036) * (tall ? 2.3 : 1);
      this.far.push({ x, y: -h, w, h, layer: 0 });
      x += w + rnd() * 0.005;
    }
    // дальняя игла/шпиль — узнаваемый ритм петербургского горизонта
    this.far.push({ x: 0.185, y: -0.115, w: 0.005, h: 0.115, layer: 0 });
    this.far.push({ x: 0.72, y: -0.09, w: 0.008, h: 0.09, layer: 0 });

    x = -0.06;
    while (x < 1.06) {
      const w = 0.028 + rnd() * 0.07;
      const h = 0.016 + rnd() * 0.07;
      this.near.push({ x, y: -h, w, h, layer: 1 });
      x += w + 0.012 + rnd() * 0.055;
    }
    this.near.push({ x: 0.4, y: -0.135, w: 0.009, h: 0.135, layer: 1 });
    this.near.push({ x: 0.845, y: -0.1, w: 0.02, h: 0.1, layer: 1 });
    // мачта/кран
    this.near.push({ x: 0.235, y: -0.16, w: 0.0025, h: 0.16, layer: 1 });

    const collect = (boxes: Box[], layer: 0 | 1): void => {
      for (const b of boxes) {
        const cols = Math.max(1, Math.round(b.w / 0.0075));
        const rows = Math.max(1, Math.round(b.h / 0.011));
        const chance = layer === 1 ? 0.1 : 0.055;
        for (let c = 0; c < cols; c += 1) {
          for (let r = 0; r < rows; r += 1) {
            if (rnd() > chance) continue;
            this.lights.push({
              x: b.x + ((c + 0.35 + rnd() * 0.3) / cols) * b.w,
              y: b.y + ((r + 0.3 + rnd() * 0.4) / rows) * b.h,
              s: layer === 1 ? 0.0016 + rnd() * 0.0012 : 0.001 + rnd() * 0.0008,
              a: (layer === 1 ? 0.75 : 0.42) * (0.5 + rnd() * 0.5),
              ph: rnd() * Math.PI * 2,
              reflect: rnd() < (layer === 1 ? 0.35 : 0.18),
              layer,
            });
          }
        }
      }
    };
    collect(this.far, 0);
    collect(this.near, 1);

    // фонари на мосту
    for (let i = 0; i < 7; i += 1) {
      this.lamps.push({
        x: 0.14 + (i / 6) * 0.72,
        y: -0.026,
        s: 0.0016,
        a: 0.95,
        ph: i * 0.7,
        reflect: true,
        layer: 1,
      });
    }
    // огни на башнях моста
    for (const tx of [0.302, 0.698]) {
      for (let i = 0; i < 4; i += 1) {
        this.lamps.push({
          x: tx + (i % 2 === 0 ? -0.0035 : 0.0035),
          y: -0.03 - i * 0.014,
          s: 0.0011,
          a: 0.85,
          ph: tx * 30 + i,
          reflect: i < 2,
          layer: 1,
        });
      }
    }

    this.mist = [];
    const mistCount = this.low ? 16 : 30;
    for (let i = 0; i < mistCount; i += 1) {
      this.mist.push({
        x: rnd(),
        y: rnd(),
        r: 0.006 + rnd() * 0.022,
        a: 0.1 + rnd() * 0.4,
        ph: rnd() * Math.PI * 2,
        sp: 0.006 + rnd() * 0.016,
      });
    }

    this.streaks = [];
    const streakCount = this.low ? 5 : 11;
    for (let i = 0; i < streakCount; i += 1) {
      this.streaks.push({
        y: 0.1 + rnd() * 0.8,
        len: 0.06 + rnd() * 0.16,
        sp: 0.12 + rnd() * 0.3,
        ph: rnd(),
        a: 0.3 + rnd() * 0.7,
      });
    }

    this.glints = [];
    const glintCount = this.low ? 18 : 46;
    for (let i = 0; i < glintCount; i += 1) {
      const lamp = this.lamps[Math.floor(rnd() * Math.max(1, this.lamps.length))];
      this.glints.push({
        x: lamp ? lamp.x + (rnd() - 0.5) * 0.16 : rnd(),
        d: Math.pow(rnd(), 1.7),
        len: 0.008 + rnd() * 0.05,
        ph: rnd() * Math.PI * 2,
        a: 0.25 + rnd() * 0.75,
      });
    }
  }

  /* --------------------------------------------------------------- lifecycle */

  resize(): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const raw = window.devicePixelRatio || 1;
    let dpr = raw > 2 ? 2 : raw;
    // на очень больших экранах снижаем плотность пикселей ради 60fps
    if (w * h * dpr * dpr > 4.6e6) dpr = Math.max(1, dpr - 0.5);
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    if (this.far.length === 0) this.buildGeometry();
    this.lastHorizon = -1;
    this.lastBoat = -1;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.reduced) {
      this.render(performance.now());
      return;
    }
    const loop = (now: number): void => {
      this.raf = requestAnimationFrame(loop);
      this.render(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setReducedMotion(value: boolean): void {
    this.reduced = value;
    this.stop();
    if (value) this.render(performance.now());
    else this.start();
  }

  get isReduced(): boolean {
    return this.reduced;
  }

  /** Один кадр по требованию (для reduced motion и редких перерисовок). */
  renderOnce(): void {
    this.render(performance.now());
  }

  private watchPerf(dt: number): void {
    if (this.low || this.reduced) return;
    this.frameSamples.push(dt);
    if (this.frameSamples.length < 110) return;
    const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples.length = 0;
    if (avg > 26) this.low = true;
  }

  /* ----------------------------------------------------------------- render */

  private render(now: number): void {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    const dt = Math.min(0.1, (now - (this.t * 1000 || now - 16)) / 1000);
    this.t = now / 1000;
    this.watchPerf(dt * 1000);

    const t = this.t;
    const look = sampleLook(timeline.pos - 0.5);
    const ctxScale = this.dpr;
    ctx.setTransform(ctxScale, 0, 0, ctxScale, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const drift = clamp(timeline.velocity / 900, -1, 1);
    const bob =
      Math.sin(t * 0.11) * 0.006 + Math.sin(t * 0.29 + 1.1) * 0.0022 + drift * 0.004;
    const horizonY = (look.horizon + bob) * h;

    this.drawSky(w, h, horizonY, look);
    if (!this.low) this.drawStars(w, horizonY, look, t);
    this.drawAurora(w, h, horizonY, look, t);
    this.drawCity(w, h, horizonY, look);
    this.drawBridge(w, h, horizonY, look);
    this.drawLights(w, h, horizonY, look, t);
    this.drawWater(w, h, horizonY, look, t);
    this.drawReflections(w, h, horizonY, look, t);
    this.drawWaves(w, h, horizonY, look, t);
    this.drawGlints(w, h, horizonY, look, t);
    this.drawFog(w, h, horizonY, look, t);
    if (!this.low) this.drawMist(w, h, horizonY, look, t);
    this.drawWind(w, h, look, t);

    this.publish(horizonY, look);
  }

  private drawSky(w: number, _h: number, horizonY: number, look: Look): void {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, Math.max(1, horizonY));
    grad.addColorStop(0, rgb(look.skyTop));
    grad.addColorStop(0.45, rgb(look.skyMid));
    grad.addColorStop(1, rgb(look.skyLow));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, Math.max(0, horizonY));
  }

  private drawStars(w: number, horizonY: number, look: Look, t: number): void {
    if (look.stars <= 0.02) return;
    const { ctx } = this;
    const rnd = mulberry32(0xbeef01);
    ctx.fillStyle = '#EAF2F8';
    const count = 54;
    for (let i = 0; i < count; i += 1) {
      const x = rnd() * w;
      const y = rnd() * horizonY * 0.82;
      const depth = 1 - y / Math.max(1, horizonY);
      const twinkle = 0.55 + 0.45 * Math.sin(t * (0.25 + rnd() * 0.5) + i * 1.7);
      ctx.globalAlpha = look.stars * depth * twinkle * 0.5;
      const s = rnd() < 0.85 ? 1 : 1.8;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  private drawAurora(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.aurora <= 0.02) return;
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, Math.max(0, horizonY));
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';

    const bands: Array<[HTMLCanvasElement, number, number, number, number]> = [
      [this.softTeal, 0.42, 0.1, 0.86, 0.3],
      [this.softViolet, 0.66, 0.14, 0.62, 0.22],
      [this.softCold, 0.3, 0.07, 0.5, 0.18],
    ];
    for (let i = 0; i < bands.length; i += 1) {
      const [sprite, bx, by, sw, sh] = bands[i];
      const cx = w * (bx + Math.sin(t * 0.045 + i * 2.1) * 0.045);
      const cy = horizonY - h * (by + Math.sin(t * 0.07 + i) * 0.02);
      const ww = w * sw * (1 + Math.sin(t * 0.03 + i) * 0.06);
      const hh = h * sh;
      ctx.globalAlpha = look.aurora * (0.1 + i * 0.028) * (0.85 + 0.15 * Math.sin(t * 0.15 + i));
      ctx.drawImage(sprite, cx - ww / 2, cy - hh / 2, ww, hh);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawCity(w: number, h: number, horizonY: number, look: Look): void {
    if (look.cityFar <= 0.01 && look.cityNear <= 0.01) return;
    const { ctx } = this;
    const pan = look.pan;

    const paint = (boxes: Box[], alpha: number, color: RGB): void => {
      if (alpha <= 0.01) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = rgb(color);
      for (let i = 0; i < boxes.length; i += 1) {
        const b = boxes[i];
        const bx = (((b.x - pan) % 1) + 1) % 1;
        ctx.fillRect(bx * w, horizonY + b.y * h, b.w * w + 0.6, -b.y * h + 1);
      }
    };

    paint(this.far, look.cityFar, mixRGB(look.skyLow, [16, 26, 36], 0.62));
    paint(this.near, look.cityNear, mixRGB(look.skyLow, [3, 7, 11], 0.88));

    // дымка у основания силуэтов
    const haze = ctx.createLinearGradient(0, horizonY - h * 0.11, 0, horizonY + 2);
    haze.addColorStop(0, rgb(look.skyLow, 0));
    haze.addColorStop(1, rgb(mixRGB(look.skyLow, [150, 175, 195], 0.35), 0.16 + look.fog * 0.4));
    ctx.globalAlpha = 1;
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizonY - h * 0.11, w, h * 0.11 + 2);

    // подсветка горизонта
    if (look.glow > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, horizonY - h * 0.16, 0, horizonY + 1);
      g.addColorStop(0, rgb(mixRGB(COLD, AMBER, 0.25), 0));
      g.addColorStop(0.72, rgb(mixRGB(COLD, AMBER, 0.3), 0.05 * look.glow));
      g.addColorStop(1, rgb(mixRGB(COLD, AMBER, 0.4), 0.16 * look.glow));
      ctx.fillStyle = g;
      ctx.fillRect(0, horizonY - h * 0.16, w, h * 0.16 + 1);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /** Дворцовый мост: две башни, пролёт, подвесы, редкие огни. */
  private drawBridge(w: number, h: number, horizonY: number, look: Look): void {
    const alpha = look.cityNear;
    if (alpha <= 0.04) return;
    const { ctx } = this;
    const pan = ((look.pan * 0.4) % 1) * w;
    const dx = -pan;
    const color = rgb(mixRGB(look.skyLow, [2, 5, 9], 0.92));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, h * 0.0011);

    const deckY = horizonY - h * 0.008;
    const towerX = [w * 0.3 + dx, w * 0.7 + dx];
    const towerTop = horizonY - h * 0.085;

    // натяжные тросы
    for (let i = 0; i < 2; i += 1) {
      const left = i === 0 ? -w * 0.05 + dx : towerX[0];
      const right = i === 0 ? towerX[0] : i === 1 ? towerX[1] : w * 1.05 + dx;
      const midY = horizonY - h * (i === 0 ? 0.02 : 0.02);
      ctx.beginPath();
      ctx.moveTo(left, midY);
      ctx.quadraticCurveTo((left + right) / 2, towerTop + h * 0.012, right, midY);
      ctx.stroke();
      // подвесы
      const span = right - left;
      const steps = Math.max(4, Math.round(span / (w * 0.018)));
      ctx.lineWidth = Math.max(0.6, h * 0.0006);
      for (let s = 1; s < steps; s += 1) {
        const f = s / steps;
        const x = left + span * f;
        const cableY =
          (1 - f) * (1 - f) * midY + 2 * (1 - f) * f * (towerTop + h * 0.012) + f * f * midY;
        ctx.beginPath();
        ctx.moveTo(x, cableY);
        ctx.lineTo(x, deckY - h * 0.002);
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(1, h * 0.0011);
    }

    // башни
    for (const tx of towerX) {
      const bw = Math.max(2, w * 0.0075);
      ctx.beginPath();
      ctx.moveTo(tx - bw, deckY + h * 0.004);
      ctx.lineTo(tx - bw * 0.55, towerTop);
      ctx.lineTo(tx + bw * 0.55, towerTop);
      ctx.lineTo(tx + bw, deckY + h * 0.004);
      ctx.closePath();
      ctx.fill();
      // шпиль
      ctx.beginPath();
      ctx.moveTo(tx, towerTop);
      ctx.lineTo(tx, towerTop - h * 0.022);
      ctx.stroke();
    }

    // настил
    ctx.fillRect(-w * 0.05 + dx, deckY, w * 1.1, Math.max(1.2, h * 0.0028));
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawLights(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.lights <= 0.02) return;
    const { ctx } = this;
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.lights.length; i += 1) {
      const l = this.lights[i];
      const flick = 0.82 + 0.18 * Math.sin(t * 0.7 + l.ph) + 0.08 * Math.sin(t * 2.3 + l.ph * 2);
      const a = l.a * look.lights * flick * (l.layer === 1 ? 1 : 0.8);
      if (a < 0.015) continue;
      const bx = (((l.x - look.pan * 0.6) % 1) + 1) % 1;
      const x = bx * w;
      const y = horizonY + l.y * h;
      const s = Math.max(1, l.s * w);
      ctx.fillStyle = rgb(AMBER, a);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (l.layer === 1) {
        ctx.globalAlpha = a * 0.5;
        ctx.drawImage(this.softWarm, x - s * 4, y - s * 4, s * 8, s * 8);
        ctx.globalAlpha = 1;
      }
    }

    for (const lamp of this.lamps) {
      const flick = 0.86 + 0.14 * Math.sin(t * 0.5 + lamp.ph);
      const a = lamp.a * look.lights * flick;
      const x = lamp.x * w;
      const y = horizonY + lamp.y * h;
      const s = Math.max(1.2, lamp.s * w);
      ctx.fillStyle = rgb(AMBER, Math.min(1, a));
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.globalAlpha = a * 0.62;
      ctx.drawImage(this.softWarm, x - s * 7, y - s * 7, s * 14, s * 14);
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private drawWater(w: number, h: number, horizonY: number, look: Look, _t: number): void {
    const { ctx } = this;
    const depth = h - horizonY;
    const near = mixRGB(look.water, look.skyLow, 0.32 + look.fog * 0.22);
    const grad = ctx.createLinearGradient(0, horizonY, 0, h);
    grad.addColorStop(0, rgb(near));
    grad.addColorStop(0.35, rgb(mixRGB(near, look.water, 0.55)));
    grad.addColorStop(1, rgb(mixRGB(look.water, [2, 5, 9], 0.55)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, horizonY, w, depth + 1);

    // мягкий переход «небо → вода»: у воды нет резного края
    const soft = ctx.createLinearGradient(
      0,
      horizonY - 1,
      0,
      horizonY + Math.max(8, depth * 0.07),
    );
    soft.addColorStop(0, rgb(mixRGB(look.skyLow, [140, 170, 195], 0.45), 0.14 + look.fog * 0.28));
    soft.addColorStop(1, rgb(look.skyLow, 0));
    ctx.fillStyle = soft;
    ctx.fillRect(0, horizonY - 1, w, Math.max(9, depth * 0.08));

    // тонкая световая кромка на границе воды и неба
    ctx.fillStyle = rgb(mixRGB(COLD, AMBER, 0.3), 0.03 + look.glow * 0.06 + look.aurora * 0.05);
    ctx.fillRect(0, horizonY - 0.5, w, 1);
  }

  private drawReflections(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.reflections <= 0.02) return;
    const { ctx } = this;
    const depth = h - horizonY;
    if (depth <= 2) return;
    ctx.globalCompositeOperation = 'lighter';

    const slices = this.low ? 4 : 7;
    const paint = (x: number, strength: number, spread: number, lenScale: number): void => {
      const len = depth * lenScale;
      const colW = Math.max(3, w * spread);
      const sliceH = len / slices;
      for (let s = 0; s < slices; s += 1) {
        const f = s / slices;
        const y = horizonY + len * f;
        // чем ниже отражение, тем сильнее его размывает рябь
        const wob =
          Math.sin(t * (1.4 + f * 3.2) + x * 21 + f * 7) * (0.6 + f * 9) +
          Math.sin(t * (0.7 + f) + x * 47 + f * 3) * (0.4 + f * 5);
        ctx.globalAlpha = strength * Math.pow(1 - f, 1.5);
        ctx.drawImage(
          this.fallWarm,
          x - (colW * (1 + f * 2.4)) / 2 + wob,
          y,
          colW * (1 + f * 2.4),
          sliceH * 2.1,
        );
      }
    };

    for (const lamp of this.lamps) {
      if (!lamp.reflect) continue;
      const bx = (((lamp.x - look.pan * 0.6) % 1) + 1) % 1;
      paint(
        bx * w,
        look.reflections * lamp.a * 0.42,
        0.0035 + (bx % 0.008),
        0.3 + (bx % 0.07) * 4,
      );
    }

    let budget = this.low ? 5 : 12;
    for (const l of this.lights) {
      if (!l.reflect || l.layer !== 1 || budget <= 0) continue;
      budget -= 1;
      const bx = (((l.x - look.pan * 0.6) % 1) + 1) % 1;
      paint(bx * w, look.reflections * l.a * 0.28, 0.0022, 0.16 + (bx % 0.05) * 3);
    }

    // холодное отражение неба и сияния — широкой полосой у горизонта
    const bandW = w * (0.42 + look.aurora * 0.3);
    ctx.globalAlpha = look.reflections * (0.05 + look.aurora * 0.1);
    ctx.drawImage(
      this.fallCold,
      w * 0.5 - bandW / 2 + Math.sin(t * 0.28) * w * 0.02,
      horizonY,
      bandW,
      depth * (0.35 + look.aurora * 0.25),
    );

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawWaves(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.waves <= 0.02) return;
    const { ctx } = this;
    const depth = h - horizonY;
    if (depth <= 2) return;
    const rows = this.low ? 9 : 16;
    const segs = this.low ? 16 : 26;
    const span = w + w * 0.3;

    ctx.lineCap = 'round';
    for (let i = 1; i <= rows; i += 1) {
      const d = i / rows;
      const y = horizonY + depth * Math.pow(d, 1.75);
      const amp = 0.6 + d * 7;
      const speed = 0.08 + d * 0.5;
      const x0 = (((t * speed * 60 + d * 90) % span) + span) % span - w * 0.15;
      const segW = span / segs;

      ctx.beginPath();
      ctx.moveTo(x0, y);
      for (let s = 1; s <= segs; s += 1) {
        const x = x0 + s * segW;
        const ph = s * 0.55 + i * 1.7 + t * (0.5 + d * 1.4);
        const yy = y + Math.sin(ph) * amp * 0.5 + Math.sin(ph * 0.37 + i) * amp * 0.35;
        ctx.lineTo(x, yy);
      }
      const light = mixRGB(look.skyLow, COLD, 0.55);
      const wv = 0.55 + look.waves * 0.95;
      ctx.strokeStyle = rgb(light, (0.02 + d * 0.062) * wv);
      ctx.lineWidth = Math.max(0.6, (0.6 + d * 1.7) * this.dpr * 0.8);
      ctx.stroke();

      ctx.strokeStyle = rgb([2, 5, 9], (0.025 + d * 0.062) * wv);
      ctx.lineWidth = Math.max(0.7, (0.8 + d * 2.2) * this.dpr * 0.8);
      ctx.beginPath();
      ctx.moveTo(x0, y + amp * 0.9);
      for (let s = 1; s <= segs; s += 1) {
        const x = x0 + s * segW;
        const ph = s * 0.55 + i * 1.7 + t * (0.5 + d * 1.4);
        const yy = y + Math.sin(ph) * amp * 0.5 + Math.sin(ph * 0.37 + i) * amp * 0.35;
        ctx.lineTo(x, yy + amp * 0.9);
      }
      ctx.stroke();
    }
  }

  private drawGlints(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (this.low || look.reflections <= 0.05) return;
    const { ctx } = this;
    const depth = h - horizonY;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const g of this.glints) {
      const y = horizonY + depth * Math.pow(g.d, 1.7);
      const a =
        look.reflections * g.a * (0.05 + 0.1 * Math.sin(t * (0.6 + g.a) + g.ph)) * (1 - g.d * 0.55);
      if (a <= 0.004) continue;
      const bx = (((g.x - look.pan * 0.6) % 1) + 1) % 1;
      const len = g.len * w * (0.4 + g.d * 1.6);
      ctx.strokeStyle = rgb(mixRGB(COLD, AMBER, 0.35), a);
      ctx.lineWidth = Math.max(0.8, (1 - g.d) * 1.6);
      ctx.beginPath();
      ctx.moveTo(bx * w - len / 2, y);
      ctx.lineTo(bx * w + len / 2, y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawFog(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.fog <= 0.02) return;
    const { ctx } = this;
    const color = mixRGB(look.skyLow, [170, 195, 215], 0.5);
    const bands: Array<[number, number, number, number]> = [
      [0.055, 0.1, 0.018, 0.55],
      [0.12, 0.17, 0.026, 0.4],
      [0.2, 0.26, 0.04, 0.28],
      [0.3, 0.2, 0.07, 0.2],
    ];
    for (let i = 0; i < bands.length; i += 1) {
      const [offset, thick, alphaK, speed] = bands[i];
      const yTop = horizonY + (h - horizonY) * offset;
      const thickPx = Math.max(4, (h - horizonY) * thick);
      const shift = Math.sin(t * speed * 0.35 + i) * w * 0.08 + timeline.pos * w * 0.05 * (i + 1);
      const grad = ctx.createLinearGradient(0, yTop, 0, yTop + thickPx);
      grad.addColorStop(0, rgb(color, 0));
      grad.addColorStop(0.5, rgb(color, look.fog * alphaK * 0.32));
      grad.addColorStop(1, rgb(color, 0));
      ctx.save();
      ctx.translate(shift % w, 0);
      ctx.fillStyle = grad;
      ctx.fillRect(-w, yTop, w * 3, thickPx);
      ctx.restore();
    }
  }

  private drawMist(w: number, h: number, horizonY: number, look: Look, t: number): void {
    if (look.mist <= 0.02) return;
    const { ctx } = this;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.mist) {
      const drift = t * p.sp;
      const x = (((p.x + drift * 0.6) % 1) + 1) % 1;
      const y =
        (((p.y - drift * 0.22 + Math.sin(t * 0.2 + p.ph) * 0.02) % 1) + 1) % 1;
      const px = x * w;
      const py = y * h * 0.9 + horizonY * 0.06;
      const r = p.r * Math.max(w, h);
      const a = p.a * look.mist * (0.1 + 0.1 * Math.sin(t * 0.3 + p.ph)) * (0.35 + y * 0.8);
      if (a <= 0.004) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(this.softCold, px - r, py - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawWind(w: number, h: number, look: Look, t: number): void {
    if (look.wind <= 0.03) return;
    const { ctx } = this;
    const color = mixRGB(COLD, [255, 255, 255], 0.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const s of this.streaks) {
      const x = (((t * s.sp * 0.35 + s.ph) % 1.4) - 0.2) * w;
      const y = s.y * h + Math.sin(t * 0.4 + s.ph * 6) * 6;
      const len = s.len * w;
      const a = look.wind * s.a * 0.05;
      const grad = ctx.createLinearGradient(x, y, x + len, y);
      grad.addColorStop(0, rgb(color, 0));
      grad.addColorStop(0.5, rgb(color, a));
      grad.addColorStop(1, rgb(color, 0));
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.8, this.dpr);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + Math.sin(t * 0.7 + s.ph * 9) * 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Публикуем CSS-переменные, чтобы SVG-слой паруса стоял ровно на воде. */
  private publish(horizonY: number, look: Look): void {
    const root = document.documentElement;
    if (Math.abs(horizonY - this.lastHorizon) > 0.4) {
      this.lastHorizon = horizonY;
      root.style.setProperty('--horizon', `${horizonY.toFixed(1)}px`);
    }
    const pos = timeline.pos;
    const inA = clamp((pos - 2.3) / 0.55, 0, 1);
    const outA = clamp((4.95 - pos) / 0.65, 0, 1);
    const boat = inA * outA;
    if (Math.abs(boat - this.lastBoat) > 0.004) {
      this.lastBoat = boat;
      root.style.setProperty('--boat-vis', boat.toFixed(3));
    }
    root.style.setProperty('--vignette', look.vignette.toFixed(3));
  }
}