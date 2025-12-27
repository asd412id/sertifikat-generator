import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/prompt-templates";
import { validateHtmlStructure, withRetry, getFallbackTemplate } from "@/lib/validation";
import { filterBackticks } from "@/lib/validation-filter";

export const runtime = "nodejs";

type GenerateBody = {
  apiKey: string;
  model: string;
  prompt: string;
  quality?: "premium" | "standard" | "quick";
  paperSize?: "a4" | "f4";
  paperSpec?: {
    label: string;
    widthPx: number;
    heightPx: number;
    widthMm: number;
    heightMm: number;
  };
};

const OPENROUTER_TEMPERATURE = 0.6; // Default temperature for balanced output

function buildSystemInstruction() {
  return `You are a professional certificate designer. Generate premium, decorative, printable certificate HTML.
- Output: Single root <div> with inline styles only
- Colors: hex/rgb/rgba ONLY (no oklab, oklch, lab, lch, color())
- No scripts, external assets, or event handlers
- Quality level: Premium creative dengan dekorasi ramai
- Temperature: 0.7`;
}

async function callOpenRouter(args: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}) {
  // Gunakan AbortController untuk timeout (30 detik)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        // Optional but recommended by OpenRouter.
        "HTTP-Referer": "https://sertifikat-generator.netlify.app",
        "X-Title": "Sertifikat Generator",
        "User-Agent": "SertifikatGenerator/1.0",
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        stream: false,
        temperature: OPENROUTER_TEMPERATURE,
      }),
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractUpstreamErrorMessage(detailsText: string) {
  try {
    const parsed = JSON.parse(detailsText) as any;
    const message =
      parsed?.error?.message ??
      parsed?.error?.metadata?.raw ??
      parsed?.error?.metadata?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    // ignore
  }
  return detailsText;
}

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.apiKey || !body.model || !body.prompt) {
    return NextResponse.json(
      { error: "Missing apiKey/model/prompt" },
      { status: 400 },
    );
  }

  // Use enhanced prompt template (always premium)
  let finalPrompt = body.prompt;
  if (body.paperSpec) {
    try {
      const template = getTemplate("premium");
      // Extract instruction from prompt (remove template metadata)
      let instruction = body.prompt;
      const markerIndex = body.prompt.indexOf("Interpret the following user markdown instruction");
      if (markerIndex !== -1) {
        const afterMarker = body.prompt.substring(markerIndex);
        const colonIndex = afterMarker.indexOf(":");
        if (colonIndex !== -1) {
          instruction = afterMarker.substring(colonIndex + 1).trim();
        }
      }

      finalPrompt = template.buildPrompt({
        instruction,
        seed: Math.floor(Math.random() * 10000),
        paperSize: body.paperSize || "a4",
        paperSpec: body.paperSpec
      });
    } catch {
      // Fallback to original prompt if template fails
      finalPrompt = body.prompt;
    }
  }

  const system = buildSystemInstruction();

  // Create new conversation without history
  const messages = [
    { role: "system", content: system },
    { role: "user", content: finalPrompt },
  ];

  try {
    // Use retry mechanism with exponential backoff
    const result = await withRetry(async () => {
      const primary = await callOpenRouter({
        apiKey: body.apiKey,
        model: body.model,
        messages,
      });

      let upstream = primary;
      let text = await upstream.text();

      // Some models/providers reject developer/system instructions (e.g. Google AI Studio).
      // If that happens, retry by embedding the instruction into the user prompt only.
      if (
        upstream.status === 400 &&
        (text.includes("Developer instruction is not enabled") ||
          text.includes("system instruction") ||
          text.includes("system message") ||
          text.includes("unsupported role") ||
          text.includes("role system is not supported"))
      ) {
        // Retry without system message but still no history
        upstream = await callOpenRouter({
          apiKey: body.apiKey,
          model: body.model,
          messages: [
            {
              role: "user",
              content: `${system}\n\n${finalPrompt}`,
            },
          ],
        });
        text = await upstream.text();
      }

      if (!upstream.ok) {
        const msg = extractUpstreamErrorMessage(text);
        const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
        const lower = msg.toLowerCase();

        let hint: string | undefined;
        if (upstream.status === 400) {
          if (text.includes("Developer instruction is not enabled") ||
            text.includes("system instruction") ||
            text.includes("system message") ||
            text.includes("unsupported role") ||
            text.includes("role system is not supported")) {
            hint = "Model/provider menolak role system/developer. Server sudah mencoba retry tanpa system message. Jika masih gagal, pilih model lain.";
          } else if (lower.includes("model") && (lower.includes("not found") || lower.includes("invalid") || lower.includes("unknown") || lower.includes("unavailable"))) {
            hint = "Model tidak valid di OpenRouter. Pastikan memilih model dari daftar OpenRouter (bukan model Z.AI langsung).";
          } else if (lower.includes("temperature") || lower.includes("max_tokens") || lower.includes("stream")) {
            hint = "Parameter request ditolak provider. Coba model lain; server memakai parameter aman (temperature<=1.0, max_tokens dibatasi).";
          }
        }

        const error: any = new Error(`OpenRouter error (${upstream.status})`);
        error.details = msg;
        error.hint = hint;
        error.status = status;
        throw error;
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Invalid OpenRouter response format");
      }

      const content = (json as { choices?: Array<{ message?: { content?: unknown } }> })
        ?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("No content in response");
      }

      return content;
    }, 3); // 3 retries untuk premium

    // Filter backticks and validate HTML structure
    const filteredResult = filterBackticks(result);
    const validation = validateHtmlStructure(filteredResult);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "HTML validation failed",
          details: validation.errors.join(", "),
          warnings: validation.warnings
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ html: validation.sanitizedHtml }, { status: 200 });
  } catch (error) {
    console.error("OpenRouter API call failed:", error);

    const err = error as any;
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        details: err.details || (err instanceof Error ? err.message : "Unknown error"),
        hint: err.hint
      },
      { status: err.status || 500 }
    );
  }
}
