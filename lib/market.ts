import { USDC, WSOL } from "./config";

export async function tokenSearch(q: string) {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) throw new Error(`dexscreener ${res.status}`);
  const data = (await res.json()) as {
    pairs?: {
      chainId?: string;
      url?: string;
      marketCap?: number;
      fdv?: number;
      priceUsd?: string;
      info?: { imageUrl?: string };
      baseToken?: { address?: string; name?: string; symbol?: string };
    }[];
  };
  const seen = new Set<string>();
  return (data.pairs ?? [])
    .filter((p) => {
      const mint = p.baseToken?.address;
      if (!mint || seen.has(mint)) return false;
      if (p.chainId && p.chainId !== "solana") return false;
      seen.add(mint);
      return true;
    })
    .slice(0, 20)
    .map((p) => ({
      mint: p.baseToken!.address!,
      name: p.baseToken?.name ?? "token",
      symbol: p.baseToken?.symbol ?? "???",
      priceUsd: Number(p.priceUsd ?? 0),
      mcap: p.marketCap ?? p.fdv ?? 0,
      image: p.info?.imageUrl,
      url: p.url ?? `https://dexscreener.com/solana/${p.baseToken!.address}`,
    }));
}

export async function swapQuote(params: {
  inputMint?: string;
  outputMint?: string;
  amountSol?: number;
  amount?: string;
}) {
  const inputMint = params.inputMint || WSOL;
  const outputMint = params.outputMint || USDC;
  const amount =
    params.amount ||
    String(Math.round((params.amountSol ?? 0.1) * 1_000_000_000));
  const url = new URL("https://lite-api.jup.ag/swap/v1/quote");
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount);
  url.searchParams.set("slippageBps", "50");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`jupiter quote ${res.status} ${await res.text()}`);
  return res.json();
}

export async function jupiterSwapTx(params: {
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  amount: string;
}) {
  const quote = await swapQuote(params);
  const res = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) throw new Error(`jupiter swap ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ swapTransaction: string }>;
}
