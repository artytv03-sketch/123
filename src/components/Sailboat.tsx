import s from './sailboat.module.css';

/** Момент ватерлинии в координатах viewBox. */
const WATERLINE = 175;

interface RigProps {
  cloth: string;
  edge: string;
  mast: string;
}

function Hull({ hull }: { hull: string }) {
  return (
    <>
      {/* корпус: тонкий килль, лёгкий подъём к носу */}
      <path
        d="M42 170 C90 168 150 166 202 158 C186 177 108 188 42 170 Z"
        fill={hull}
      />
      {/* рубка */}
      <path d="M103 168 L109 161 L139 161 L146 167 Z" fill={hull} />
    </>
  );
}

function Rig({ cloth, edge, mast }: RigProps) {
  return (
    <g className={s.sails}>
      {/* мачта, гик, штаг */}
      <path d="M128 166 L128 40" stroke={mast} strokeWidth="2" fill="none" />
      <path d="M128 164 L92 164" stroke={mast} strokeWidth="1.6" fill="none" />
      <path d="M130 50 L200 157" stroke={mast} strokeWidth="0.9" fill="none" />
      {/* грот */}
      <path
        d="M125 46 C112 88 102 130 92 162 L125 162 Z"
        fill={cloth}
        stroke={edge}
        strokeWidth="0.9"
      />
      {/* стаксель */}
      <path
        d="M129 50 L198 156 C176 130 150 90 129 50 Z"
        fill={cloth}
        stroke={edge}
        strokeWidth="0.9"
      />
    </g>
  );
}

/**
 * Минималистичный силуэт яхты: покачивается, реагирует на ветер,
 * медленно уходит в туман и оставляет за собой отражение.
 */
export function Sailboat() {
  return (
    <div className={s.layer} aria-hidden="true">
      <div className={s.boat}>
        <div className={s.inner}>
          <svg viewBox="0 0 240 350" width="100%" height="100%">
            <defs>
              <linearGradient id="sailCloth" x1="0" y1="40" x2="0" y2="164">
                <stop offset="0" stopColor="#0a121b" />
                <stop offset="0.55" stopColor="#050b12" />
                <stop offset="1" stopColor="#02060a" />
              </linearGradient>
              {/* отражение — на пару тон светлее, иначе тонет в тёмной воде */}
              <linearGradient id="sailClothRefl" x1="0" y1="164" x2="0" y2="300">
                <stop offset="0" stopColor="#2b3d4b" />
                <stop offset="0.5" stopColor="#1b2a36" />
                <stop offset="1" stopColor="#0d151d" />
              </linearGradient>
              <linearGradient
                id="reflFade"
                x1="0"
                y1={WATERLINE}
                x2="0"
                y2="320"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
                <stop offset="0.4" stopColor="#fff" stopOpacity="0.26" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask
                id="reflMask"
                maskUnits="userSpaceOnUse"
                x="0"
                y={WATERLINE}
                width="240"
                height="175"
              >
                <rect
                  x="0"
                  y={WATERLINE}
                  width="240"
                  height="175"
                  fill="url(#reflFade)"
                />
              </mask>
            </defs>

            {/* отражение */}
            <g
              className={s.reflection}
              mask="url(#reflMask)"
              transform={`translate(0,${WATERLINE * 2}) scale(1,-1)`}
            >
              <Hull hull="#22323f" />
              <Rig
                cloth="url(#sailClothRefl)"
                edge="rgba(190, 214, 234, 0.16)"
                mast="#26363f"
              />
            </g>

            {/* корпус */}
            <Hull hull="var(--sail-hull)" />
            <Rig
              cloth="url(#sailCloth)"
              edge="var(--sail-edge)"
              mast="var(--sail-mast)"
            />

            {/* кильватерный след */}
            <g className={s.wake} stroke="var(--sail-wake)" fill="none" strokeWidth="1.1">
              <path d="M36 176 C66 181 170 180 212 171" opacity="0.5" />
              <path d="M24 181 C64 188 170 187 222 174" opacity="0.28" />
              <path d="M14 188 C60 197 172 195 232 179" opacity="0.15" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}