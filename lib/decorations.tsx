import React from "react";
import type { Palette } from "@/lib/palettes";
import { mulberry32, pickOne, randomInt } from "@/lib/random";

type SafeRect = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type DecorationKind =
  | "circle"
  | "blur-circle"
  | "ring"
  | "pill"
  | "rounded-rect"
  | "triangle"
  | "dot-cluster";

type Corner = "tl" | "tr" | "bl" | "br";

export type GenerateDecorationsOptions = {
  palette: Palette;
  seed: number;
  /**
   * Jumlah dekorasi. Bisa di-set berapa pun (secara konsep "tak terbatas").
   * Default: otomatis berdasar seed.
   */
  count?: number;
  /**
   * Area kosong (dalam persentase 0..100) yang akan dihindari agar pusat sertifikat tetap lapang.
   */
  safeRect?: SafeRect;
};

function inSafeRect(x: number, y: number, safeRect: SafeRect) {
  return (
    x >= safeRect.xMin &&
    x <= safeRect.xMax &&
    y >= safeRect.yMin &&
    y <= safeRect.yMax
  );
}

function pickPosition(rng: () => number, safeRect: SafeRect) {
  // Lebih rapi: tempelkan dekorasi di sekitar sudut dengan jitter kecil.
  // Ini menjaga komposisi tetap elegan dan menghindari area tengah.
  const anchors = [
    { x: 14, y: 14 },
    { x: 86, y: 14 },
    { x: 14, y: 86 },
    { x: 86, y: 86 },
  ] as const;

  const a = pickOne(rng, anchors);
  const jx = (rng() - 0.5) * 22;
  const jy = (rng() - 0.5) * 22;
  let x = Math.max(0, Math.min(100, a.x + jx));
  let y = Math.max(0, Math.min(100, a.y + jy));

  // Rejection sampling ringan supaya tidak masuk safeRect.
  for (let i = 0; i < 10; i++) {
    if (!inSafeRect(x, y, safeRect)) break;
    const b = pickOne(rng, anchors);
    x = Math.max(0, Math.min(100, b.x + (rng() - 0.5) * 22));
    y = Math.max(0, Math.min(100, b.y + (rng() - 0.5) * 22));
  }

  return { x, y };
}

function colorClass(rng: () => number, palette: Palette) {
  return pickOne(rng, [palette.decoAClass, palette.decoBClass, palette.decoCClass]);
}

function makeKey(seed: number, i: number) {
  return `${seed}-${i}`;
}

function cornerAnchor(corner: Corner) {
  switch (corner) {
    case "tl":
      return { x: 10, y: 12, origin: "top left" as const };
    case "tr":
      return { x: 90, y: 12, origin: "top right" as const };
    case "bl":
      return { x: 10, y: 88, origin: "bottom left" as const };
    case "br":
      return { x: 90, y: 88, origin: "bottom right" as const };
  }
}

function clipPolygon(kind: number) {
  // Bentuk panel besar seperti contoh (tanpa lengkung)
  // Dibedakan per corner supaya terasa rapi.
  const shapes = [
    "polygon(0 0, 100% 0, 70% 100%, 0 70%)",
    "polygon(0 0, 100% 0, 100% 35%, 35% 100%, 0 100%)",
    "polygon(0 0, 100% 0, 100% 100%, 0 55%)",
    "polygon(0 0, 100% 0, 60% 100%, 0 100%)",
  ];
  const base = shapes[kind % shapes.length];

  // Mirror untuk corner kanan/bawah agar konsisten.
  // Gunakan transform di style, bukan ubah polygon.
  return base;
}

function cornerTransform(corner: Corner) {
  const sx = corner === "tr" || corner === "br" ? -1 : 1;
  const sy = corner === "bl" || corner === "br" ? -1 : 1;
  return `scale(${sx}, ${sy})`;
}

function addCornerPanel(
  nodes: React.ReactNode[],
  rng: () => number,
  palette: Palette,
  seed: number,
  corner: Corner,
  i: number,
) {
  const a = cornerAnchor(corner);
  const w = randomInt(rng, 260, 420);
  const h = randomInt(rng, 220, 360);
  const kind = randomInt(rng, 0, 6);
  const opacity = 0.10 + rng() * 0.10;
  const rotate = randomInt(rng, -10, 10);
  const color = colorClass(rng, palette);

  nodes.push(
    <div
      key={`${makeKey(seed, i)}-panel-${corner}`}
      className={`pointer-events-none absolute ${color}`}
      style={{
        left: `${a.x}%`,
        top: `${a.y}%`,
        width: w,
        height: h,
        opacity,
        transform: `translate(-50%, -50%) ${cornerTransform(corner)} rotate(${rotate}deg)`,
        transformOrigin: a.origin,
        clipPath: clipPolygon(kind),
      }}
      aria-hidden="true"
    />,
  );
}

function addDotMatrix(
  nodes: React.ReactNode[],
  rng: () => number,
  palette: Palette,
  seed: number,
  corner: Corner,
  i: number,
) {
  const a = cornerAnchor(corner);
  const dot = randomInt(rng, 6, 10);
  const gap = randomInt(rng, 12, 18);
  const cols = randomInt(rng, 5, 9);
  const rows = randomInt(rng, 3, 6);
  const opacity = 0.18 + rng() * 0.18;
  const color = colorClass(rng, palette);

  const dx = corner === "tr" || corner === "br" ? -1 : 1;
  const dy = corner === "bl" || corner === "br" ? -1 : 1;

  nodes.push(
    <div
      key={`${makeKey(seed, i)}-dots-${corner}`}
      className="pointer-events-none absolute"
      style={{
        left: `${a.x}%`,
        top: `${a.y}%`,
        transform: `translate(-50%, -50%) translate(${dx * 120}px, ${dy * 56}px)`,
        opacity,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${dot}px)`,
        gap: `${gap}px`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }).map((_, j) => (
        <div
          key={`${makeKey(seed, i)}-dots-${corner}-${j}`}
          className={`rounded-full ${color}`}
          style={{ width: dot, height: dot, opacity: 0.9 }}
        />
      ))}
    </div>,
  );
}

function addTriangleCluster(
  nodes: React.ReactNode[],
  rng: () => number,
  palette: Palette,
  seed: number,
  corner: Corner,
  i: number,
) {
  const a = cornerAnchor(corner);
  const size = randomInt(rng, 14, 18);
  const gap = randomInt(rng, 10, 14);
  const cols = randomInt(rng, 4, 6);
  const rows = randomInt(rng, 3, 5);
  const opacity = 0.16 + rng() * 0.14;
  const color = colorClass(rng, palette);

  const dx = corner === "tr" || corner === "br" ? -1 : 1;
  const dy = corner === "bl" || corner === "br" ? -1 : 1;
  const rot = randomInt(rng, -8, 8);

  nodes.push(
    <div
      key={`${makeKey(seed, i)}-tri-${corner}`}
      className="pointer-events-none absolute"
      style={{
        left: `${a.x}%`,
        top: `${a.y}%`,
        transform: `translate(-50%, -50%) translate(${dx * 64}px, ${dy * 132}px) rotate(${rot}deg)`,
        opacity,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap: `${gap}px`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cols * rows }).map((_, j) => (
        <div
          key={`${makeKey(seed, i)}-tri-${corner}-${j}`}
          className={color}
          style={{
            width: size,
            height: size,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            opacity: 0.95,
          }}
        />
      ))}
    </div>,
  );
}

export function generateDecorations(opts: GenerateDecorationsOptions): React.ReactNode[] {
  const rng = mulberry32(opts.seed ^ 0x9e3779b9);

  const safeRect: SafeRect =
    opts.safeRect ??
    ({ xMin: 22, xMax: 78, yMin: 24, yMax: 78 } satisfies SafeRect);

  const count =
    typeof opts.count === "number" ? opts.count : randomInt(rng, 26, 46);

  const kinds: readonly DecorationKind[] = [
    "circle",
    "blur-circle",
    "ring",
    "pill",
    "rounded-rect",
    "triangle",
    "dot-cluster",
  ];

  const nodes: React.ReactNode[] = [];

  // 1) Corner composition (lebih mirip contoh, tetap rapi)
  const corners: readonly Corner[] = ["tl", "tr", "bl", "br"];
  const styleVariant = randomInt(rng, 0, 2);

  corners.forEach((corner, idx) => {
    const baseI = idx * 10;
    addCornerPanel(nodes, rng, opts.palette, opts.seed, corner, baseI);

    // Pilih kombinasi pattern per corner supaya kreatif tapi tidak ramai berantakan.
    if (styleVariant === 0) {
      if (rng() > 0.25) addDotMatrix(nodes, rng, opts.palette, opts.seed, corner, baseI + 1);
      if (rng() > 0.45) addTriangleCluster(nodes, rng, opts.palette, opts.seed, corner, baseI + 2);
    } else if (styleVariant === 1) {
      if (rng() > 0.15) addTriangleCluster(nodes, rng, opts.palette, opts.seed, corner, baseI + 2);
      if (rng() > 0.55) addDotMatrix(nodes, rng, opts.palette, opts.seed, corner, baseI + 1);
    } else {
      if (rng() > 0.2) addDotMatrix(nodes, rng, opts.palette, opts.seed, corner, baseI + 1);
    }
  });

  // 2) Floating accents near edges (tetap seeded + bisa diskalakan "tak terbatas")
  for (let i = 0; i < count; i++) {
    const kind = pickOne(rng, kinds);
    const { x, y } = pickPosition(rng, safeRect);
    const rotate = randomInt(rng, -18, 18);
    const opacity = 0.06 + rng() * 0.10;

    const baseStyle: React.CSSProperties = {
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      opacity,
    };

    if (kind === "circle") {
      const size = randomInt(rng, 40, 160);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute rounded-full ${colorClass(rng, opts.palette)}`}
          style={{ ...baseStyle, width: size, height: size }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "blur-circle") {
      const size = randomInt(rng, 120, 320);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute rounded-full blur-2xl ${colorClass(rng, opts.palette)}`}
          style={{ ...baseStyle, width: size, height: size, opacity: opacity * 0.8 }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "ring") {
      const size = randomInt(rng, 120, 320);
      const stroke = randomInt(rng, 2, 4);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute rounded-full border ${opts.palette.borderClass}`}
          style={{
            ...baseStyle,
            width: size,
            height: size,
            borderWidth: stroke,
            background: "transparent",
            opacity: opacity * 0.55,
          }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "pill") {
      const w = randomInt(rng, 120, 260);
      const h = randomInt(rng, 24, 56);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute rounded-full ${colorClass(rng, opts.palette)}`}
          style={{ ...baseStyle, width: w, height: h }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "rounded-rect") {
      const w = randomInt(rng, 90, 220);
      const h = randomInt(rng, 90, 220);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute rounded-[2.5rem] ${colorClass(rng, opts.palette)}`}
          style={{ ...baseStyle, width: w, height: h }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "triangle") {
      const size = randomInt(rng, 80, 220);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className={`pointer-events-none absolute ${colorClass(rng, opts.palette)}`}
          style={{
            ...baseStyle,
            width: size,
            height: size,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
          aria-hidden="true"
        />,
      );
      continue;
    }

    if (kind === "dot-cluster") {
      const dot = randomInt(rng, 4, 8);
      const gap = randomInt(rng, 10, 16);
      const cols = randomInt(rng, 4, 7);
      const rows = randomInt(rng, 3, 6);
      nodes.push(
        <div
          key={makeKey(opts.seed, i)}
          className="pointer-events-none absolute"
          style={{
            ...baseStyle,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${dot}px)`,
            gap: `${gap}px`,
            opacity: opacity * 1.15,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: cols * rows }).map((_, j) => (
            <div
              key={`${makeKey(opts.seed, i)}-${j}`}
              className={`rounded-full ${colorClass(rng, opts.palette)}`}
              style={{ width: dot, height: dot, opacity: 0.9 }}
            />
          ))}
        </div>,
      );
      continue;
    }
  }

  return nodes;
}
