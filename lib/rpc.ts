import { SOLANA_RPC } from "./config";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

export async function solBalance(address: string): Promise<number> {
  const out = await rpc<{ value: number }>("getBalance", [address]);
  return Number(out.value) / 1e9;
}

export async function tokenHoldings(address: string) {
  const sol = await rpc<{ value: number }>("getBalance", [address]);
  const solLamports = sol.value;
  const parsed = await rpc<{
    value: {
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              tokenAmount: { uiAmount: number | null; decimals: number };
            };
          };
        };
      };
    }[];
  }>("getParsedTokenAccountsByOwner", [
    address,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
  ]);
  const tokens = (parsed?.value ?? [])
    .map((row) => {
      const info = row.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: info.tokenAmount.uiAmount ?? 0,
        decimals: info.tokenAmount.decimals,
      };
    })
    .filter((t) => t.amount > 0);
  return {
    address,
    sol: Number(solLamports) / 1e9,
    lamports: String(solLamports),
    tokens,
  };
}
