"use client";

import React from "react";
import { PALETTES } from "@/lib/palettes";
import { TEMPLATES } from "@/lib/templates";
import type { DesignState } from "@/lib/design";
import { RandomDecorationsLayer } from "@/components/random-decorations";

export const CERT_ASPECT_RATIO = 297 / 210;

export const CertificateCanvas = React.forwardRef<
  HTMLDivElement,
  {
    design: DesignState;
    aiHtml?: string | null;
    aspectRatio?: number;
  }
>(function CertificateCanvas({ design, aiHtml, aspectRatio }, ref) {
  const palette = PALETTES.find((p) => p.id === design.paletteId) ?? PALETTES[0];
  const template =
    TEMPLATES.find((t) => t.id === design.templateId) ?? TEMPLATES[0];

  const Template = template.Component;

  return (
    <div
      ref={ref}
      data-export-root="true"
      className={`relative w-full rounded-xl ${palette.paperClass} ${
        aiHtml ? "overflow-visible" : "overflow-hidden"
      }`}
      style={{ aspectRatio: String(aspectRatio ?? CERT_ASPECT_RATIO) }}
    >
      {aiHtml ? (
        <div
          className="absolute inset-0"
          // aiHtml sudah disanitasi sebelum dikirim ke sini.
          dangerouslySetInnerHTML={{ __html: aiHtml }}
        />
      ) : (
        <>
          <Template palette={palette} seed={design.seed} />

          <div className="absolute inset-0">
            <RandomDecorationsLayer palette={palette} seed={design.seed} />
          </div>
        </>
      )}

      <div className={`pointer-events-none absolute inset-0 border ${palette.softBorderClass}`} />
      <div className="absolute inset-0" aria-hidden="true" />
    </div>
  );
});
