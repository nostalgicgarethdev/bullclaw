import { json, options } from "@/lib/http";
import { ensureStore } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET() {
  const s = await ensureStore();
  return json({
    agents: Object.keys(s.agents).length,
    users: Object.keys(s.users).length,
    tokens: s.tokens.length,
    split: { agent: 0.9, house: 0.1 },
  });
}
