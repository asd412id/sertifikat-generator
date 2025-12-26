import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    // Avoid caching stale model list.
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Failed to fetch models (${res.status})` },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
