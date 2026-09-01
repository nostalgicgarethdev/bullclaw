"use client";

import { useEffect, useState } from "react";

type Coin = {
  mint: string;
  name: string;
  symbol: string;
  mcap: number;
  image?: string;
  url: string;
  agentName?: string;
  source?: string;
};

export default function TokensPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/tokens")
      .then((r) => {
        if (!r.ok) throw new Error(`board ${r.status}`);
        return r.json();
      })
      .then((data: { tokens?: Coin[] }) => setCoins(data.tokens ?? []))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">Live board</p>
      <h1 className="display mt-3 text-4xl font-extrabold">Fresh launches</h1>
      <p className="mt-3 max-w-xl text-sm text-[var(--color-mute)]">
        BullClaw mints first. Then the public pump.fun tape. Eligible BullClaw launches
        settle creator fees 90 / 10 to the agent wallet.
      </p>
      {error && (
        <p className="mt-6 text-sm text-[var(--color-ember)]">Tape paused ({error}).</p>
      )}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coins.map((c) => (
          <a
            key={c.mint}
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="flex gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4 hover:border-[var(--color-gold)]/50"
          >
            {c.image ? (
              <img src={c.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-black" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                ${c.symbol}
                {c.source === "bullclaw" ? " · 90/10" : ""}
              </p>
              <p className="mt-1 text-xs text-[var(--color-mute)]">
                {c.agentName
                  ? c.agentName
                  : c.mcap
                    ? `$${c.mcap.toLocaleString(undefined, { maximumFractionDigits: 0 })} mcap`
                    : "new"}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
