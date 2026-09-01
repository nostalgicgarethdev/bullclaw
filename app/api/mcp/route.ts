import { readKey } from "@/lib/auth";
import { cors, json, options } from "@/lib/http";
import { handleMcp } from "@/lib/mcp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function OPTIONS() {
  return options();
}

export async function GET() {
  return json({
    name: "bullclaw",
    transport: "streamable-http",
    auth: "Authorization: Bearer bck_...",
    tools: 17,
    split: "90/10",
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: Record<string, unknown>;
  };
  const out = await handleMcp(body, readKey(req));
  return NextResponse.json(out, { headers: cors });
}
