import { PALETTES } from "@/lib/palettes";
import { TEMPLATES } from "@/lib/templates";

export type DesignState = {
  templateId: (typeof TEMPLATES)[number]["id"];
  paletteId: (typeof PALETTES)[number]["id"];
  seed: number;
};

export function createRandomDesign(): DesignState {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];

  // Keep seed in 32-bit range for deterministic template variants.
  const seed = (Math.random() * 2 ** 32) >>> 0;

  return {
    templateId: template.id,
    paletteId: palette.id,
    seed,
  };
}
