import { clamp } from './random';

export interface SceneSlot {
  index: number;
  top: number;
  height: number;
}

export interface TimelineState {
  /** высота вьюпорта */
  vh: number;
  scrollY: number;
  /** прогресс всей страницы 0..1 */
  progress: number;
  /** непрерывная координата в «пространстве сцен»: 0 = центр сцены 0 */
  pos: number;
  /** индекс текущей сцены */
  scene: number;
  /** прогресс внутри текущей сцены 0..1 */
  local: number;
  /** сглаженная скорость скролла, px/сек */
  velocity: number;
}

export const timeline: TimelineState = {
  vh: 0,
  scrollY: 0,
  progress: 0,
  pos: 0,
  scene: 0,
  local: 0,
  velocity: 0,
};

type Listener = () => void;

const listeners = new Set<Listener>();
let slots: SceneSlot[] = [];
let lastScrollY = 0;
let lastTime = 0;
let rafId = 0;

function emit(): void {
  for (const fn of listeners) fn();
}

function update(): void {
  const now = performance.now();
  const dt = lastTime ? Math.min(0.25, (now - lastTime) / 1000) : 0.016;
  lastTime = now;

  const y = window.scrollY || window.pageYOffset || 0;
  timeline.vh = window.innerHeight;
  timeline.scrollY = y;
  timeline.velocity = dt > 0 ? (y - lastScrollY) / dt : 0;
  lastScrollY = y;

  const docHeight = Math.max(1, document.documentElement.scrollHeight - timeline.vh);
  timeline.progress = clamp(y / docHeight, 0, 1);

  const center = y + timeline.vh * 0.5;
  let index = 0;
  let local = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (center < slot.top) break;
    index = i;
    local = (center - slot.top) / Math.max(1, slot.height);
  }
  if (slots.length) {
    timeline.scene = index;
    timeline.local = clamp(local, 0, 1);
    timeline.pos = index + timeline.local;
  } else {
    timeline.scene = 0;
    timeline.local = 0;
    timeline.pos = clamp(progress01(y, timeline.vh, docHeight) * 0.999, 0, 0.999);
  }

  emit();
}

function progress01(y: number, vh: number, docHeight: number): number {
  const total = docHeight + vh;
  return clamp(y / Math.max(1, total), 0, 1);
}

/** Пересобрать геометрию сцен после изменения лейаута. */
export function measureScenes(): void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  const y = window.scrollY || window.pageYOffset || 0;
  slots = nodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    return { index, top: rect.top + y, height: rect.height };
  });
  update();
}

/** Обновление из обработчика скролла (через rAF, чтобы не дёргать layout). */
export function requestTimelineUpdate(): void {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    update();
  });
}

export function subscribeTimeline(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTimeline(): TimelineState {
  return timeline;
}