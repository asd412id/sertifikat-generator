import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GenerateBody = {
  apiKey: string;
  model: string;
  prompt: string;
};

const OPENROUTER_TEMPERATURE = 0.512;
const OPENROUTER_MAX_TOKENS = 8000;

function buildSystemInstruction() {
  return "You generate a premium, decorative, printable certificate HTML (no markdown, no explanations). Output a single root <div> with inline styles only. You MAY include text content for the certificate. No <script>, no external assets, no event handlers. Use only hex/rgb/rgba colors. Do NOT use oklab(), oklch(), lab(), lch(), or color(). Keep the output concise and under ~3800 tokens to avoid truncation.";
}

async function callOpenRouter(args: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      // Optional but recommended by OpenRouter.
      "HTTP-Referer": "http://localhost",
      "X-Title": "Sertifikat2",
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      stream: false,
      // max_tokens: OPENROUTER_MAX_TOKENS,
      // // Some upstream providers behind OpenRouter are stricter than OpenAI's usual range.
      // // Keep output bounded to reduce latency and avoid overly long HTML.
      temperature: OPENROUTER_TEMPERATURE,
    }),
  });
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

  const system = buildSystemInstruction();
  
  // Create new conversation without history - only include system and current user message
  const messages = [
    { role: "system", content: system },
    { role: "user", content: body.prompt },
  ];
  
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
    /Developer instruction is not enabled|system\s+instruction|system\s+message|unsupported\s+role\s*:\s*system|role\s+system\s+is\s+not\s+supported/i.test(
      text,
    )
  ) {
    // Retry without system message but still no history
    upstream = await callOpenRouter({
      apiKey: body.apiKey,
      model: body.model,
      messages: [
        {
          role: "user",
          content: `${system}\n\n${body.prompt}`,
        },
      ],
    });
    text = await upstream.text();
  }

  if (!upstream.ok) {
    const msg = extractUpstreamErrorMessage(text);
    const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    const lower = msg.toLowerCase();
    return NextResponse.json(
      {
        error: `OpenRouter error (${upstream.status})`,
        details: msg,
        hint:
          upstream.status === 400
            ? /developer instruction is not enabled|unsupported\s+role\s*:\s*system|role\s+system\s+is\s+not\s+supported/i.test(
                lower,
              )
              ? "Model/provider menolak role system/developer. Server sudah mencoba retry tanpa system message. Jika masih gagal, pilih model lain."
              : /model/i.test(lower) && /not found|invalid|unknown|unavailable/i.test(lower)
                ? "Model tidak valid di OpenRouter. Pastikan memilih model dari daftar OpenRouter (bukan model Z.AI langsung)."
                : /temperature|max_tokens|stream/i.test(lower)
                  ? "Parameter request ditolak provider. Coba model lain; server memakai parameter aman (temperature<=1.0, max_tokens dibatasi)."
                  : undefined
            : undefined,
      },
      { status },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Invalid OpenRouter response", details: text },
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
}
