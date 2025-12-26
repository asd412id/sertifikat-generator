import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type GenerateBody = {
  apiKey: string;
  model: string;
  prompt: string;
};

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

  return fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      "Accept-Language": "en-US,en",
      Accept: "application/json",
      "Referer": "http://localhost:3000",
      "Origin": "http://localhost:3000",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    body: JSON.stringify(args.body),
  });
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

  const system = buildSystemInstruction();

  // Create new conversation without history - only include system and current user message
  const requestBody = {
    model: body.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: body.prompt },
    ],
    // Avoid slow reasoning mode for this use-case (pure decorative HTML output).
    // thinking: { type: "disabled" },
    stream: false,
    // Keep output bounded to reduce latency and avoid overly long HTML.
    // max_tokens: 8000,
    temperature: 0.512,
  };

  try {
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
      return NextResponse.json(
        { error: `Z.AI error (${upstream.status})`, details: msg, hint },
        { status },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid Z.AI response", details: text },
        { status: 502 },
      );
    }

    const content = (json as { choices?: Array<{ message?: { content?: unknown } }> })
      ?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "No content in response", details: json },
        { status: 502 },
      );
    }

    return NextResponse.json({ html: content }, { status: 200 });
  } catch (error) {
    console.error("Z.AI API call failed:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
