import type { Palette } from "@/lib/palettes";
import { mulberry32, randomInt } from "@/lib/random";

export type TemplateProps = {
  palette: Palette;
  seed: number;
};

function FrameClassic({ palette, seed }: TemplateProps) {
  const rng = mulberry32(seed ^ 0x13579bdf);
  const a = randomInt(rng, 120, 190);
  const b = randomInt(rng, 150, 240);
  const c = randomInt(rng, 70, 140);

  const ax = randomInt(rng, 6, 16);
  const ay = randomInt(rng, 6, 18);
  const bx = randomInt(rng, 8, 18);
  const by = randomInt(rng, 8, 18);
  const cx = randomInt(rng, 14, 28);
  const cy = randomInt(rng, 10, 22);

  return (
    <>
      <div className={`absolute inset-0 ${palette.gradientClass}`} />
      <div className="absolute inset-10 rounded-2xl border border-slate-200/70" />
      <div
        className={`absolute inset-12 rounded-xl border-2 ${palette.borderClass}`}
      />
      <div
        className={`absolute rounded-full ${palette.decoAClass}`}
        style={{ left: `${ax}%`, top: `${ay}%`, width: a, height: a, opacity: 0.9 }}
      />
      <div
        className={`absolute rounded-full ${palette.decoBClass}`}
        style={{ right: `${bx}%`, bottom: `${by}%`, width: b, height: b, opacity: 0.85 }}
      />
      <div
        className={`absolute rounded-full ${palette.decoCClass}`}
        style={{ left: `${cx}%`, bottom: `${cy}%`, width: c, height: c, opacity: 0.8 }}
      />
    </>
  );
}

function DiagonalRibbons({ palette, seed }: TemplateProps) {
  const rng = mulberry32(seed);
  const ribbonWidth = randomInt(rng, 140, 210);

  return (
    <>
      <div className={`absolute inset-0 ${palette.gradientClass}`} />
      <div className={`absolute inset-10 rounded-2xl border ${palette.softBorderClass}`} />
      <div className={`absolute inset-12 rounded-xl border-2 ${palette.borderClass}`} />

      <div
        className={`absolute -left-24 -top-24 h-[380px] w-[380px] rotate-12 rounded-[3rem] ${palette.decoAClass}`}
      />
      <div
        className={`absolute -right-28 -bottom-28 h-[420px] w-[420px] -rotate-12 rounded-[3rem] ${palette.decoBClass}`}
      />

      <div
        className={`absolute left-0 top-0 h-full -translate-x-1/3 -skew-x-12 ${palette.decoCClass}`}
        style={{ width: ribbonWidth }}
      />
      <div
        className={`absolute right-0 top-0 h-full translate-x-1/3 skew-x-12 ${palette.decoCClass}`}
        style={{ width: Math.max(120, Math.round(ribbonWidth * 0.8)) }}
      />
    </>
  );
}

function DotGridModern({ palette, seed }: TemplateProps) {
  const rng = mulberry32(seed);
  const dotSize = randomInt(rng, 6, 10);
  const gap = randomInt(rng, 14, 20);

  return (
    <>
      <div className={`absolute inset-0 ${palette.gradientClass}`} />
      <div className={`absolute inset-10 rounded-2xl border ${palette.softBorderClass}`} />
      <div className={`absolute inset-12 rounded-xl border-2 ${palette.borderClass}`} />

      <div className={`absolute left-10 top-10 h-44 w-44 rounded-full ${palette.decoAClass}`} />
      <div className={`absolute right-10 bottom-10 h-56 w-56 rounded-full ${palette.decoBClass}`} />

      <div
        className={`absolute left-16 top-16 opacity-70`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(8, ${dotSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full ${palette.decoCClass}`}
            style={{ width: dotSize, height: dotSize }}
          />
        ))}
      </div>

      <div
        className={`absolute bottom-16 right-20 opacity-70`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(6, ${dotSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full ${palette.decoCClass}`}
            style={{ width: dotSize, height: dotSize }}
          />
        ))}
      </div>
    </>
  );
}

function HexTiles({ palette, seed }: TemplateProps) {
  const rng = mulberry32(seed);
  const opacity = 0.08 + rng() * 0.06;

  return (
    <>
      <div className={`absolute inset-0 ${palette.gradientClass}`} />
      <div className={`absolute inset-10 rounded-2xl border ${palette.softBorderClass}`} />
      <div className={`absolute inset-12 rounded-xl border-2 ${palette.borderClass}`} />

      <svg className="absolute inset-0" viewBox="0 0 1200 850" aria-hidden="true">
        <defs>
          <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="translate(0 0)">
            <path
              d="M30 0 L60 13 L60 39 L30 52 L0 39 L0 13 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1200" height="850" fill="url(#hex)" className="text-slate-400" style={{ opacity }} />
      </svg>

      <div className={`absolute -right-24 top-16 h-64 w-64 rounded-full ${palette.decoBClass}`} />
      <div className={`absolute -left-24 bottom-16 h-72 w-72 rounded-full ${palette.decoAClass}`} />
    </>
  );
}

function MinimalCorners({ palette, seed }: TemplateProps) {
  const rng = mulberry32(seed);
  const corner = randomInt(rng, 92, 150);
  const inset = randomInt(rng, 10, 20);
  const flip = rng() > 0.5;

  return (
    <>
      <div className={`absolute inset-0 ${palette.gradientClass}`} />
      <div className={`absolute inset-10 rounded-2xl border ${palette.softBorderClass}`} />
      <div className={`absolute inset-12 rounded-xl border-2 ${palette.borderClass}`} />

      <div
        className={`absolute ${palette.decoAClass}`}
        style={{
          left: inset,
          top: inset,
          width: corner,
          height: corner,
          clipPath: flip
            ? "polygon(0 0, 100% 0, 0 100%)"
            : "polygon(0 0, 100% 0, 100% 100%)",
          opacity: 0.9,
        }}
      />
      <div
        className={`absolute ${palette.decoBClass}`}
        style={{
          right: inset,
          top: inset,
          width: corner,
          height: corner,
          clipPath: flip
            ? "polygon(100% 0, 100% 100%, 0 0)"
            : "polygon(0 0, 100% 0, 0 100%)",
          opacity: 0.85,
        }}
      />
      <div
        className={`absolute ${palette.decoBClass}`}
        style={{
          left: inset,
          bottom: inset,
          width: corner,
          height: corner,
          clipPath: flip
            ? "polygon(0 0, 100% 100%, 0 100%)"
            : "polygon(0 0, 100% 100%, 100% 0)",
          opacity: 0.85,
        }}
      />
      <div
        className={`absolute ${palette.decoAClass}`}
        style={{
          right: inset,
          bottom: inset,
          width: corner,
          height: corner,
          clipPath: flip
            ? "polygon(100% 0, 100% 100%, 0 100%)"
            : "polygon(0 100%, 100% 0, 100% 100%)",
          opacity: 0.9,
        }}
      />
    </>
  );
}

export const TEMPLATES = [
  { id: "frame-classic", name: "Frame Classic", Component: FrameClassic },
  { id: "diagonal-ribbons", name: "Diagonal Ribbons", Component: DiagonalRibbons },
  { id: "dot-grid", name: "Dot Grid", Component: DotGridModern },
  { id: "hex-tiles", name: "Hex Tiles", Component: HexTiles },
  { id: "minimal-corners", name: "Minimal Corners", Component: MinimalCorners },
] as const;
