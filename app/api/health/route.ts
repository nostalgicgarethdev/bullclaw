import { json, options } from "@/lib/http";
import { platformAddress, solBalance } from "@/lib/solana";
import { ensureStore } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET() {
  const store = await ensureStore();
  const platform = platformAddress();
  return json({
    ok: true,
    name: "bullclaw",
    split: { agent: 0.9, house: 0.1 },
    agents: Object.keys(store.agents).length,
    tokens: store.tokens.length,
    platform,
    platformSol: platform ? await solBalance(platform) : 0,
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    master: Boolean(process.env.MASTER_KEY),
  });
}
