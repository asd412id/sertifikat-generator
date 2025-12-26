"use client";

import React from "react";
import DOMPurify from "dompurify";
import { formatRgb, parse } from "culori";
import { CertificateCanvas } from "@/components/certificate-canvas";
import { Toolbar } from "@/components/toolbar";
import { createRandomDesign, type DesignState } from "@/lib/design";
import { exportElementAsImage, exportElementAsPdf } from "@/lib/export";

// Reuse color sanitization helper from export.ts
function replaceUnsupportedCssColors(input: string) {
  if (!input) return input;
  if (!/(oklab\(|oklch\(|lab\(|lch\(|color\()/i.test(input)) return input;

  return input.replace(/(?:okl(?:ab|ch)|l(?:ab|ch)|color)\([^)]*\)/gi, (match) => {
    try {
      const parsed = parse(match);
      if (parsed) {
        return formatRgb(parsed) ?? match;
      } else {
        return match;
      }
    } catch {
      return match;
    }
  });
}

type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
};

type AiProvider = "openrouter" | "zai";

type AiModel = {
  id: string;
  name?: string;
  description?: string;
};

type CertificateData = {
  instruction: string;
};

type PaperSize = "a4" | "f4";

const STORAGE_KEY = {
  provider: "sertifikat2.ai.provider",
  openrouterApiKey: "sertifikat2.openrouter.apiKey",
  openrouterModel: "sertifikat2.openrouter.model",
  zaiApiKey: "sertifikat2.zai.apiKey",
  zaiModel: "sertifikat2.zai.model",
  certData: "sertifikat2.certificate.data",
  paperSize: "sertifikat2.certificate.paperSize",
} as const;

function getPaperSpec(paper: PaperSize) {
  if (paper === "f4") {
    return {
      id: "f4" as const,
      label: "F4/Folio (21.5×33 cm)",
      widthMm: 330,
      heightMm: 215,
      widthPx: 1200,
      heightPx: 764,
      aspectRatio: 330 / 215,
    };
  }

  return {
    id: "a4" as const,
    label: "A4 (21×27.5 cm)",
    widthMm: 275,
    heightMm: 210,
    widthPx: 1200,
    heightPx: 850,
    aspectRatio: 275 / 210,
  };
}

function safeGetLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function legacyCertDataToInstruction(legacy: any): string {
  const lines: string[] = [];
  const push = (label: string, value: unknown) => {
    const v = typeof value === "string" ? value.trim() : "";
    if (v) lines.push(`${label}: ${v}`);
  };

  push("Nomor", legacy?.certificateNumber);
  push("Nama peserta", legacy?.participantName);
  push("Asal instansi", legacy?.institution);
  push("Sebagai", legacy?.asRole);
  push("Keterangan kegiatan", legacy?.activityText);
  push("Lokasi/Tanggal", legacy?.locationDate);
  push("Penandatangan", legacy?.signerName);
  push("Jabatan penandatangan", legacy?.signerTitle);
  push("NIP/ID", legacy?.signerId);

  if (!lines.length) return "";
  return [
    "Isi sertifikat dengan data berikut:",
    ...lines,
    "",
    "Preferensi layout:",
    "- Susun rapi, proporsional, dan semua teks harus muat di safe area tanpa overflow.",
  ].join("\n");
}

function downloadHtmlString(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }
}

function buildPrompt(seed: number, data: CertificateData, paper: PaperSize) {
  const spec = getPaperSpec(paper);
  return [
    "Create an elegant, decorative, and well-structured landscape certificate (with text).",
    "Output MUST be HTML ONLY (no markdown, no explanations).",
    "No <script>, no inline event handlers (onload/onclick)",
    "Use simple <div> / <svg> elements with INLINE styles only (no external stylesheets).",
    "Visual style: modern geometric premium (corner polygon/ribbon panels, dot-matrix, triangle clusters, hex transparency), allow subtle layering/overlap",
    "Composition: decorations dominate corners/edges, balanced left/right, include rhythm/patterns (grid, diagonal, tessellation), avoid chaotic randomness.",
    "Decorations: feel 'premium' with layers frames (thin outer frame, inner frame, accent corner pieces), plus consistent small patterns (dots/triangles/hex) and accent ribbon/panel diagonals.",
    "You may use subtle shadows for aesthetics (e.g., soft box-shadow on frames/panels), but don't overdo. Use small blur (<= 18px) and low opacity (<= 0.18).",
    "Colors: harmonious accent colors",
    "MUST use export-compatible colors (ONLY hex / rgb() / rgba()). Do NOT use oklab(), oklch(), lab(), lch(), or color().",
    "IMPORTANT (SAFE AREA): all text MUST stay inside the content area (safe area) to avoid being clipped by the frame.",
    "Safe area rule: create a main content container with at least 6% padding from all sides (e.g., inset:6% or padding:6%).",
    "Main content container must be: box-sizing:border-box; max-width:100%; max-height:100%; overflow:hidden.",
    "All text blocks must have max-width:100% and use word-break:break-word + overflow-wrap:anywhere.",
    "Avoid position absolute for long text; use flex/column layout so height adapts and stays within safe area.",
    "NO OVERFLOW: ensure no text spills outside the paper area. If content is too long, reduce font-size, line-height, and block spacing until everything fits.",
    "Ensure root and content area have overflow:hidden so no elements/text escape the paper.",
    "Typography MUST be clean: use consistent block spacing, and proportional font sizes.",
    "Ensure sufficient contrast: main text dark, accents as needed.",
    `Paper size: ${spec.label} (LANDSCAPE).`,
    `Canvas considered ${spec.widthPx}x${spec.heightPx} (landscape). Aspect ratio ~${spec.widthMm}:${spec.heightMm}.`,
    "Use % based positioning and sizing for responsiveness.",
    `Variation seed: ${seed}.`,
    "Interpret the following user markdown instruction to fill the certificate text; respect newlines and symbols that may carry meaning (render according to user intent, do not invent new data):",
    data.instruction?.trim() ? data.instruction.trim() : "(instruction empty)",
    "Output must be a single root element:",
    "<div style=\"position:relative;width:100%;height:100%;overflow:hidden;box-sizing:border-box;\"> ... </div>",
    "Inside root, create a content area like:",
    "<div style=\"position:absolute;inset:6%;display:flex;flex-direction:column;justify-content:space-between;align-items:center;gap:14px;overflow:hidden;box-sizing:border-box;\"> ... </div>",
  ].join("\n");
}

export default function Page() {
  // Hindari hydration mismatch: jangan pakai Math.random() saat SSR render.
  const [design, setDesign] = React.useState<DesignState>(() => ({
    templateId: "frame-classic",
    paletteId: "ocean",
    seed: 1,
  }));
  const [busy, setBusy] = React.useState(false);
  const canvasRef = React.useRef<HTMLDivElement | null>(null);

  const [provider, setProvider] = React.useState<AiProvider>(() => {
    const storedProvider = safeGetLocalStorage(STORAGE_KEY.provider);
    return storedProvider === "zai" ? "zai" : "openrouter";
  });
  const [apiKey, setApiKey] = React.useState<string>(() => {
    const key =
      provider === "openrouter"
        ? safeGetLocalStorage(STORAGE_KEY.openrouterApiKey)
        : safeGetLocalStorage(STORAGE_KEY.zaiApiKey);
    return key ?? "";
  });
  const [modelId, setModelId] = React.useState<string>(() => {
    const storedModel =
      provider === "openrouter"
        ? safeGetLocalStorage(STORAGE_KEY.openrouterModel)
        : safeGetLocalStorage(STORAGE_KEY.zaiModel);
    return storedModel ?? "";
  });
  const [modelQuery, setModelQuery] = React.useState<string>(() => {
    const storedModel =
      provider === "openrouter"
        ? safeGetLocalStorage(STORAGE_KEY.openrouterModel)
        : safeGetLocalStorage(STORAGE_KEY.zaiModel);
    return storedModel ?? "";
  });
  const [models, setModels] = React.useState<AiModel[]>([]);
  const [aiHtml, setAiHtml] = React.useState<string | null>(null);
  const [aiHtmlOriginal, setAiHtmlOriginal] = React.useState<string | null>(null);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const [paperSize, setPaperSize] = React.useState<PaperSize>(() => {
    const stored = safeGetLocalStorage(STORAGE_KEY.paperSize);
    return stored === "f4" ? "f4" : "a4";
  });
  const paperSpec = React.useMemo(() => getPaperSpec(paperSize), [paperSize]);

  const [certificateData, setCertificateData] = React.useState<CertificateData>(() => {
    const storedRaw = safeGetLocalStorage(STORAGE_KEY.certData);
    const stored = safeParseJson<any>(storedRaw);
    if (stored && typeof stored?.instruction === "string") {
      return { instruction: stored.instruction };
    }

    // Migrate legacy structured fields to a free-form instruction.
    const migrated = legacyCertDataToInstruction(stored);
    return { instruction: migrated };
  });

  const [modelOpen, setModelOpen] = React.useState(false);
  const modelBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [certFormOpen, setCertFormOpen] = React.useState(false);

  React.useEffect(() => {
    setDesign(createRandomDesign());
  }, []);

  React.useEffect(() => {
    safeSetLocalStorage(STORAGE_KEY.certData, JSON.stringify(certificateData));
  }, [certificateData]);

  React.useEffect(() => {
    safeSetLocalStorage(STORAGE_KEY.paperSize, paperSize);
  }, [paperSize]);

  React.useEffect(() => {
    safeSetLocalStorage(STORAGE_KEY.provider, provider);

    const storedKey =
      provider === "openrouter"
        ? safeGetLocalStorage(STORAGE_KEY.openrouterApiKey)
        : safeGetLocalStorage(STORAGE_KEY.zaiApiKey);
    const storedModel =
      provider === "openrouter"
        ? safeGetLocalStorage(STORAGE_KEY.openrouterModel)
        : safeGetLocalStorage(STORAGE_KEY.zaiModel);

    setApiKey(storedKey ?? "");
    setModelId(storedModel ?? "");
    setModelQuery(storedModel ?? "");
    setModelOpen(false);

    (async () => {
      try {
        const url = provider === "openrouter" ? "/api/openrouter/models" : "/api/zai/models";
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        const list: AiModel[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setModels(list);
      } catch {
        setModels([]);
      }
    })();
  }, [provider]);

  React.useEffect(() => {
    if (!apiKey) return;
    if (provider === "openrouter") {
      safeSetLocalStorage(STORAGE_KEY.openrouterApiKey, apiKey);
    } else {
      safeSetLocalStorage(STORAGE_KEY.zaiApiKey, apiKey);
    }
  }, [apiKey, provider]);

  React.useEffect(() => {
    if (!modelId) return;
    if (provider === "openrouter") {
      safeSetLocalStorage(STORAGE_KEY.openrouterModel, modelId);
    } else {
      safeSetLocalStorage(STORAGE_KEY.zaiModel, modelId);
    }
  }, [modelId, provider]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModelOpen(false);
      if (e.key === "Escape") setCertFormOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const box = modelBoxRef.current;
      if (!box) return;
      if (box.contains(e.target as Node)) return;
      setModelOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const filteredModels = React.useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return models.slice(0, 30);
    return models
      .filter((m) =>
        `${m.id} ${m.name ?? ""} ${m.description ?? ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 30);
  }, [models, modelQuery]);

  async function withCanvas(action: (el: HTMLElement) => Promise<void>) {
    const el = canvasRef.current;
    if (!el) return;
    setBusy(true);
    try {
      await action(el);
    } finally {
      setBusy(false);
    }
  }

  async function generateWithAi() {
    if (!apiKey || !modelId) {
      return;
    }

    setAiError(null);
    setBusy(true);
    try {
      const prompt = buildPrompt(design.seed, certificateData, paperSize);
      const url =
        provider === "openrouter" ? "/api/openrouter/generate" : "/api/zai/generate";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model: modelId, prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json?.details === "string" && json.details
            ? json.details
            : typeof json?.error === "string" && json.error
              ? json.error
              : "AI request failed";
        const hint = typeof json?.hint === "string" ? json.hint : "";
        throw new Error(hint ? `${msg}\n${hint}` : msg);
      }

      const rawHtml = typeof json?.html === "string" ? json.html : "";
      const sanitizedColors = replaceUnsupportedCssColors(rawHtml);
      const clean = DOMPurify.sanitize(sanitizedColors, {
        USE_PROFILES: { html: true, svg: true, svgFilters: true },
      });
      setAiHtmlOriginal(clean);
      setAiHtml(clean);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadAiHtml() {
    if (!aiHtmlOriginal) return;
    const doc = [
      "<!doctype html>",
      "<html>",
      "<head>",
      "<meta charset=\"utf-8\" />",
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
      "<title>Sertifikat - AI HTML</title>",
      "</head>",
      "<body style=\"margin:0;padding:0;background:#f4f4f5;\">",
      // Make the certificate fill the viewport nicely.
      "<div style=\"max-width:1200px;margin:24px auto;padding:0 16px;\">",
      `<div style=\"width:100%;aspect-ratio:${paperSpec.widthMm}/${paperSpec.heightMm};\">`,
      aiHtmlOriginal,
      "</div>",
      "</div>",
      "</body>",
      "</html>",
    ].join("\n");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadHtmlString(doc, `sertifikat-ai-${stamp}.html`);
  }

  function printAiHtml() {
    if (!aiHtmlOriginal) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups for this site to use the print feature.');
      return;
    }

    const doc = [
      "<!doctype html>",
      "<html>",
      "<head>",
      "<meta charset=\"utf-8\" />",
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
      "<title>Sertifikat - Print</title>",
      "<style>",
      "* {",
      "  box-sizing: border-box;",
      "}",
      "@media print {",
      `  @page { margin: 10mm; size: ${paperSize === "a4" ? "A4" : "F4"} landscape; }`,
      "  html, body {",
      "    margin: 0;",
      "    padding: 0;",
      "    width: 100%;",
      "    height: 100%;",
      "  }",
      "  body {",
      "    display: flex;",
      "    align-items: center;",
      "    justify-content: center;",
      "  }",
      "  .certificate-wrapper {",
      "    width: 100%;",
      "    height: 100%;",
      "    display: flex;",
      "    align-items: center;",
      "    justify-content: center;",
      "  }",
      "}",
      "@media screen {",
      "  body { margin: 20px; background: #f4f4f5; }",
      "  .certificate-wrapper {",
      "    max-width: 1200px;",
      "    margin: 0 auto;",
      "  }",
      "}",
      "</style>",
      "</head>",
      "<body>",
      "<div class=\"certificate-wrapper\">",
      aiHtmlOriginal,
      "</div>",
      "<script>",
      "window.onload = function() {",
      "  window.print();",
      "  window.onafterprint = function() {",
      "    window.close();",
      "  };",
      "};",
      "</script>",
      "</body>",
      "</html>",
    ].join("\n");

    printWindow.document.write(doc);
    printWindow.document.close();
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="mx-auto max-w-full px-40 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Generator Background Sertifikat (Landscape)
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Generate memakai AI (OpenRouter / Z.AI) (HTML dekorasi tanpa teks),
            lalu bisa diunduh sebagai PDF/PNG/JPG.
          </p>
        </header>

        <Toolbar
          busy={busy}
          onGenerate={() => void generateWithAi()}
          onDownloadHtml={downloadAiHtml}
          canDownloadHtml={Boolean(aiHtmlOriginal)}
          onPrint={printAiHtml}
          canPrint={Boolean(aiHtmlOriginal)}
          onDownloadPdf={() =>
            withCanvas((el) =>
              exportElementAsPdf(el, {
                filename: "sertifikat-background.pdf",
                scale: 4,
                paperSize,
              }),
            )
          }
          onDownloadPng={() =>
            withCanvas((el) =>
              exportElementAsImage(el, {
                filename: "sertifikat-background.png",
                format: "png",
                scale: 4,
              }),
            )
          }
          onDownloadJpg={() =>
            withCanvas((el) =>
              exportElementAsImage(el, {
                filename: "sertifikat-background.jpg",
                format: "jpg",
                scale: 4,
                jpegQuality: 0.96,
              }),
            )
          }
        />

        {aiError ? (
          <div className="mt-3 rounded-md border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
            {aiError}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-black">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AiProvider)}
                className="mt-1 h-10 w-full rounded-md border border-black/12 bg-white px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="zai">Z.AI (GLM)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-black">
                {provider === "openrouter" ? "OpenRouter API Key" : "Z.AI API Key"}
              </label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder={provider === "openrouter" ? "sk-or-..." : "YOUR_API_KEY"}
                className="mt-1 h-10 w-full rounded-md border border-black/12 px-3 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <p className="mt-1 text-xs text-zinc-600">
                Disimpan di localStorage browser.
              </p>
            </div>

            <div ref={modelBoxRef} className="relative md:col-span-2">
              <label className="text-sm font-medium text-black">
                Model (pencarian)
              </label>
              <input
                value={modelQuery}
                onChange={(e) => {
                  setModelQuery(e.target.value);
                  setModelOpen(true);
                }}
                onFocus={() => setModelOpen(true)}
                type="text"
                placeholder="Cari model..."
                className="mt-1 h-10 w-full rounded-md border border-black/12 px-3 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10"
              />

              {modelOpen ? (
                <div className="absolute z-10 mt-2 w-full max-h-56 overflow-auto rounded-md border border-black/8 bg-white shadow-sm">
                  {filteredModels.length ? (
                    <ul className="divide-y divide-black/6">
                      {filteredModels.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setModelId(m.id);
                              setModelQuery(m.id);
                              setModelOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-black/4 ${
                              modelId === m.id ? "bg-black/4" : ""
                            }`}
                          >
                            <div className="font-medium text-black">{m.id}</div>
                            {m.name ? (
                              <div className="text-xs text-zinc-600">{m.name}</div>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-3 py-2 text-sm text-zinc-600">
                      Model tidak ditemukan.
                    </div>
                  )}
                </div>
              ) : null}

              <p className="mt-1 text-xs text-zinc-600">Terpilih: {modelId || "-"}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-black">Ukuran Kertas</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="mt-1 h-10 w-full rounded-md border border-black/12 bg-white px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="a4">A4 (Landscape)</option>
                <option value="f4">F4/Folio (Landscape)</option>
              </select>
              <p className="mt-1 text-xs text-zinc-600">
                Pilihan ini mempengaruhi arahan prompt AI, preview, dan ukuran halaman PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-black">Data Sertifikat</h2>
              <p className="mt-1 text-xs text-zinc-600">Isi data peserta dan kegiatan untuk di-generate oleh AI.</p>
            </div>
            <button
              type="button"
              onClick={() => setCertFormOpen(true)}
              className="h-9 rounded-md border border-black/12 bg-white px-4 text-sm text-black hover:bg-black/4 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              Isi Data
            </button>
          </div>
        </div>

        {certFormOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="mx-4 w-full max-w-2xl rounded-2xl border border-black/8 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Data Sertifikat</h2>
                <button
                  type="button"
                  onClick={() => setCertFormOpen(false)}
                  className="rounded-md p-1 text-black hover:bg-black/4 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-black">Instruksi (bebas)</label>
                  <textarea
                    value={certificateData.instruction}
                    onChange={(e) =>
                      setCertificateData((s) => ({ ...s, instruction: e.target.value }))
                    }
                    rows={10}
                    placeholder={
                      "Contoh:\n" +
                      "Nomor: 400.3.7.4/04.8606/DISDIK\n" +
                      "Nama peserta: ASDAR SYAM, S.Pd.\n" +
                      "Asal instansi: UPTD SMPN 39 SINJAI\n" +
                      "Sebagai: NARASUMBER\n" +
                      "Lokasi/Tanggal: Kabupaten Sinjai, 17 Oktober 2025\n" +
                      "Penandatangan: IRWAN SUAIB, S.STP., M.Si\n" +
                      "Jabatan: Kepala Dinas Pendidikan Kab. Sinjai\n" +
                      "NIP: 19790322 199912 1 001\n" +
                      "Preferensi: teks terpusat, rapi, tidak overflow, nama peserta max 35px."
                    }
                    className="mt-1 w-full rounded-md border border-black/12 px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <p className="mt-2 text-xs text-zinc-600">
                    Cukup jelaskan data dan preferensi posisi/penataan teks. AI akan menafsirkan instruksi ini.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCertFormOpen(false)}
                    className="h-9 rounded-md border border-black/12 bg-white px-4 text-sm text-black hover:bg-black/4 focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-black/8 bg-white p-4">
          <div className="mx-auto w-full max-w-5xl">
            <CertificateCanvas
              ref={canvasRef}
              design={design}
              aiHtml={aiHtml}
              aspectRatio={paperSpec.aspectRatio}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
