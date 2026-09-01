import { json, options } from "@/lib/http";
import { platformAddress, solBalance } from "@/lib/solana";
import { ensureStore } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET() {
  try {
    const store = await ensureStore();
    const platform = platformAddress();
    let platformSol = 0;
    let rpcError: string | null = null;
    if (platform) {
      try {
        platformSol = await solBalance(platform);
      } catch (e) {
        rpcError = e instanceof Error ? e.message : "rpc failed";
      }
    }
    return json({
      ok: true,
      name: "bullclaw",
      split: { agent: 0.9, house: 0.1 },
      agents: Object.keys(store.agents).length,
      tokens: store.tokens.length,
      platform,
      platformSol,
      rpcError,
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      master: Boolean(process.env.MASTER_KEY),
    });
  } catch (e) {
    return json({
      ok: false,
      error: e instanceof Error ? e.message : "health failed",
    }, 200);
  }
}
