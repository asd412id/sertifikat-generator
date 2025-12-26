"use client";

import React from "react";
import type { Palette } from "@/lib/palettes";
import { generateDecorations } from "@/lib/decorations";

export function RandomDecorationsLayer(props: {
  palette: Palette;
  seed: number;
  /** Default: otomatis (18..34) */
  count?: number;
}) {
  const nodes = React.useMemo(() => {
    return generateDecorations({
      palette: props.palette,
      seed: props.seed,
      count: props.count,
      // Jaga area tengah tetap lega untuk teks manual.
      safeRect: { xMin: 18, xMax: 82, yMin: 22, yMax: 82 },
    });
  }, [props.palette, props.seed, props.count]);

  return <>{nodes}</>;
}
