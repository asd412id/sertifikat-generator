import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ZaiModel = {
  id: string;
  name?: string;
  description?: string;
};

const MODELS: ZaiModel[] = [
  { id: "glm-4.7", name: "GLM-4.7" },
  { id: "glm-4.6", name: "GLM-4.6" },
  { id: "glm-4.6v", name: "GLM-4.6V (Vision)" },
  { id: "glm-4.5", name: "GLM-4.5" },
];

export async function GET() {
  return NextResponse.json({ data: MODELS }, { status: 200 });
}
