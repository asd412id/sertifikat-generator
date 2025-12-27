import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/prompt-templates";
import { validateHtmlStructure, withRetry, getFallbackTemplate } from "@/lib/validation";
import { filterBackticks } from "@/lib/validation-filter";

export const runtime = "nodejs";
export const maxDuration = 30;

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

const ZAI_TEMPERATURE = 0.6;

async function callZai(args: {
  apiKey: string;
  endpoint: "general" | "coding";
  body: unknown;
}) {
  const defaultBase =
    args.endpoint === "coding"
      ? "https://api.z.ai/api/coding/paas/v4"
      : "https://api.z.ai/api/paas/v4";

  const envBase =
    args.endpoint === "coding"
      ? process.env.ZAI_CODING_BASE_URL
      : process.env.ZAI_BASE_URL;

  const base = typeof envBase === "string" && envBase ? envBase : defaultBase;

  // Gunakan AbortController untuk timeout (30 detik)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en",
        Accept: "application/json",
        // Hapus Referer dan Origin yang hardcoded untuk production
        // Gunakan User-Agent yang valid
        "User-Agent": "SertifikatGenerator/1.0",
      },
      body: JSON.stringify(args.body),
      signal: controller.signal,
      // Tambahkan revalidate untuk production
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function buildSystemInstruction() {
  return "You generate a premium, decorative, printable certificate HTML (no markdown, no explanations). Output a single root <div> with inline styles only. You MAY include text content for the certificate. No <script>, no external assets, no event handlers. Use only hex/rgb/rgba colors. Do NOT use oklab(), oklch(), lab(), lch(), or color(). Keep the output concise and under ~3800 tokens to avoid truncation.";
}

function extractUpstreamErrorMessage(detailsText: string) {
  try {
    const parsed = JSON.parse(detailsText) as any;
    const message =
      parsed?.error?.message ??
      parsed?.message ??
      parsed?.msg ??
      parsed?.error;
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

  const system = `You are a professional certificate designer. Generate premium, decorative, printable certificate HTML.
- Output: Single root <div> with inline styles only
- Colors: hex/rgb/rgba ONLY (no oklab, oklch, lab, lch, color())
- No scripts, external assets, or event handlers
- Quality level: Premium creative dengan dekorasi ramai
- Temperature: 0.7`;

  // Create new conversation without history
  const requestBody = {
    model: body.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: finalPrompt },
    ],
    stream: false,
    temperature: 0.7,
  };

  try {
    // Use retry mechanism with exponential backoff
    const result = await withRetry(async () => {
      // Use plan subscription endpoint by default.
      const primary = await callZai({
        apiKey: body.apiKey,
        endpoint: "coding",
        body: requestBody,
      });

      let upstream = primary;
      let text = await upstream.text();

      // Fallback to general endpoint if coding endpoint is not available for this key.
      if (!upstream.ok) {
        console.log("Z.AI coding endpoint failed, trying general endpoint:", upstream.status, text);
        upstream = await callZai({
          apiKey: body.apiKey,
          endpoint: "general",
          body: requestBody,
        });
        text = await upstream.text();
      }

      if (!upstream.ok) {
        const msg = extractUpstreamErrorMessage(text);
        const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
        const hint = /Insufficient balance|no resource package/i.test(msg)
          ? "Akun Z.AI kamu tidak punya resource package yang cocok untuk endpoint ini. Pastikan subscription/plan aktif atau top up sesuai produk yang kamu pakai."
          : undefined;

        const error: any = new Error(`Z.AI error (${upstream.status})`);
        error.details = msg;
        error.hint = hint;
        error.status = status;
        throw error;
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Invalid Z.AI response format");
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
    console.error("Z.AI API call failed:", error);

    const err = error as any;

    // Handle specific error types
    if (err.name === 'AbortError') {
      return NextResponse.json(
        {
          error: "Z.AI timeout",
          details: "Request took too long (>30s)",
          hint: "Coba generate ulang atau gunakan model yang lebih cepat. Pastikan koneksi internet stabil."
        },
        { status: 504 }
      );
    }

    if (err.message?.includes('fetch failed') || err.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: "Network error",
          details: "Cannot connect to Z.AI API",
          hint: "Pastikan environment variables ZAI_BASE_URL dan API key sudah benar di Netlify. Cek juga koneksi internet server."
        },
        { status: 502 }
      );
    }

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
