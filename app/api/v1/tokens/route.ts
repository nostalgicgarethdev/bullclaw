import { json, options } from "@/lib/http";
import { tokenSearch } from "@/lib/market";
import { ensureStore } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET() {
  const store = await ensureStore();
  type Row = {
    mint: string;
    name: string;
    symbol: string;
    image?: string;
    url: string;
    agentName: string;
    source: "bullclaw" | "tape";
    createdAt: number;
    mcap: number;
  };
  const ours: Row[] = store.tokens.map((t) => ({
    mint: t.mint,
    name: t.name,
    symbol: t.symbol,
    image: t.imageUrl,
    url: t.pumpFunUrl,
    agentName: t.agentName,
    source: "bullclaw",
    createdAt: t.createdAt,
    mcap: 0,
  }));
  let tape: Row[] = [];
  try {
    tape = (await tokenSearch("pump.fun")).map((t) => ({
      mint: t.mint,
      name: t.name,
      symbol: t.symbol,
      image: t.image,
      url: t.url,
      agentName: "",
      source: "tape" as const,
      createdAt: 0,
      mcap: t.mcap,
    }));
  } catch {
    tape = [];
  }
  const seen = new Set(ours.map((t) => t.mint));
  return json({
    split: "90/10",
    tokens: [...ours, ...tape.filter((t) => !seen.has(t.mint))].slice(0, 36),
  });
}
