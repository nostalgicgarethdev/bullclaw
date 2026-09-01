"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Agent = {
  id: string;
  name: string;
  persona: string;
  wallet: string;
  skills: string[];
  token?: { mint: string; symbol: string; pumpFunUrl: string };
  whitelist: { address: string; label?: string }[];
};

type Msg = { role: string; content: string; tools?: { name: string }[] };

const KEY = "bullclaw-key";

async function api(path: string, key: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
}

export default function DashboardPage() {
  const [key, setKey] = useState("");
  const [handle, setHandle] = useState("");
  const [existing, setExisting] = useState("");
  const [me, setMe] = useState<{ handle: string; agents: Agent[] } | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [name, setName] = useState("Bull desk");
  const [persona, setPersona] = useState("Aggressive Solana agent. Launch, quote, get paid.");
  const [chat, setChat] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<{ sol: number; tokens: { mint: string; amount: number }[] } | null>(
    null,
  );
  const [earnings, setEarnings] = useState<Record<string, unknown> | null>(null);
  const [launch, setLaunch] = useState({ name: "", symbol: "", description: "" });
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const stored = localStorage.getItem(KEY) || "";
    if (stored) setKey(stored);
  }, []);

  useEffect(() => {
    if (!key) return;
    localStorage.setItem(KEY, key);
    api("/api/v1/me", key)
      .then((data) => {
        setMe(data);
        if (!agentId && data.agents?.[0]) setAgentId(data.agents[0].id);
        setErr(null);
      })
      .catch((e: Error) => {
        setMe(null);
        setErr(e.message);
      });
  }, [key]);

  const agent = useMemo(
    () => me?.agents.find((a) => a.id === agentId) ?? null,
    [me, agentId],
  );

  useEffect(() => {
    if (!key || !agent) return;
    api(`/api/v1/agents/${agent.id}/messages`, key)
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => undefined);
    fetch(`/api/health`)
      .then((r) => r.json())
      .then(() =>
        fetch(`https://api.mainnet-beta.solana.com`, { method: "POST" }).catch(() => undefined),
      );
    api(`/api/v1/agents/${agent.id}`, key)
      .then(async () => {
        const port = await fetch(
          `https://api.mainnet-beta.solana.com`,
        ).catch(() => null);
        void port;
      })
      .catch(() => undefined);
  }, [key, agent?.id]);

  useEffect(() => {
    if (!agent) return;
    fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [agent.wallet],
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        const lamports = d.result?.value ?? 0;
        setPortfolio({ sol: lamports / 1e9, tokens: [] });
      })
      .catch(() => undefined);
  }, [agent?.wallet]);

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    setBusy("signup");
    setErr(null);
    try {
      const data = await api("/api/v1/signup", "", {
        method: "POST",
        body: JSON.stringify({ handle }),
      });
      setKey(data.apiKey);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "signup failed");
    } finally {
      setBusy(null);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!key) return;
    setBusy("create");
    setErr(null);
    try {
      const data = await api("/api/v1/agents", key, {
        method: "POST",
        body: JSON.stringify({ name, persona }),
      });
      const next = await api("/api/v1/me", key);
      setMe(next);
      setAgentId(data.agent.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "create failed");
    } finally {
      setBusy(null);
    }
  }

  async function onChat(e: FormEvent) {
    e.preventDefault();
    if (!key || !agent || !chat.trim()) return;
    const text = chat.trim();
    setChat("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy("chat");
    try {
      const data = await api(`/api/v1/agents/${agent.id}/chat`, key, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, tools: data.tools },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "chat failed");
    } finally {
      setBusy(null);
    }
  }

  async function onLaunch(e: FormEvent) {
    e.preventDefault();
    if (!key || !agent) return;
    setBusy("launch");
    setErr(null);
    try {
      const data = await api("/api/v1/launch", key, {
        method: "POST",
        body: JSON.stringify({
          agentId: agent.id,
          name: launch.name,
          symbol: launch.symbol,
          description: launch.description,
          confirm: true,
        }),
      });
      if (data.error) throw new Error(data.error);
      const next = await api("/api/v1/me", key);
      setMe(next);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: JSON.stringify(data, null, 2) },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "launch failed");
    } finally {
      setBusy(null);
    }
  }

  async function loadEarnings() {
    if (!key || !agent) return;
    setBusy("earn");
    try {
      setEarnings(await api(`/api/v1/agents/${agent.id}/earnings`, key));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "earnings failed");
    } finally {
      setBusy(null);
    }
  }

  if (!key) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">Desk</p>
        <h1 className="display mt-3 text-4xl font-extrabold">Get a desk</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-mute)]">
          Creates a BullClaw account and a <code className="text-[var(--color-gold)]">bck_</code> API
          key. Same key for the dashboard, REST, and MCP. Agent wallet pays every launch.
        </p>
        <form onSubmit={onSignup} className="mt-8 space-y-4">
          <label className="block text-xs uppercase tracking-[0.16em] text-[var(--color-mute)]">
            Handle
            <input
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm outline-none focus:border-[var(--color-gold)]"
              placeholder="@you"
            />
          </label>
          <button
            disabled={busy === "signup"}
            className="w-full rounded-full bg-[var(--color-ember)] px-5 py-3 text-sm font-medium text-black"
          >
            {busy === "signup" ? "Opening…" : "Open desk"}
          </button>
        </form>
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            setKey(existing.trim());
          }}
        >
          <label className="block text-xs uppercase tracking-[0.16em] text-[var(--color-mute)]">
            Already have a key
            <input
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm outline-none focus:border-[var(--color-gold)]"
              placeholder="bck_..."
            />
          </label>
          <button className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">
            Sign in
          </button>
        </form>
        {err && <p className="mt-4 text-sm text-[var(--color-ember)]">{err}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
            @{me?.handle || "desk"} · 90/10
          </p>
          <h1 className="display mt-2 text-4xl font-extrabold">Agent pit</h1>
        </div>
        <button
          className="text-xs uppercase tracking-[0.16em] text-[var(--color-mute)]"
          onClick={() => {
            localStorage.removeItem(KEY);
            setKey("");
            setMe(null);
          }}
        >
          Sign out
        </button>
      </div>
      <p className="mt-3 break-all text-xs text-[var(--color-mute)]">
        API key {key.slice(0, 12)}… · launches are paid from the agent wallet
      </p>
      {err && <p className="mt-3 text-sm text-[var(--color-ember)]">{err}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          {(me?.agents ?? []).map((a) => (
            <button
              key={a.id}
              onClick={() => setAgentId(a.id)}
              className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                a.id === agentId
                  ? "border-[var(--color-gold)] bg-[var(--color-panel)]"
                  : "border-[var(--color-line)]"
              }`}
            >
              <p className="font-medium">{a.name}</p>
              <p className="mt-1 truncate text-[10px] text-[var(--color-mute)]">{a.wallet}</p>
            </button>
          ))}
          <form onSubmit={onCreate} className="rounded-2xl border border-[var(--color-line)] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">New agent</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-black px-3 py-2 text-sm"
              placeholder="name"
            />
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-black px-3 py-2 text-sm"
              rows={3}
            />
            <button className="mt-2 w-full rounded-full bg-[var(--color-ember)] py-2 text-xs font-medium text-black">
              {busy === "create" ? "Minting…" : "Create + wallet"}
            </button>
          </form>
        </aside>

        {agent ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">Wallet</p>
              <p className="mt-2 break-all text-sm">{agent.wallet}</p>
              <p className="mt-1 text-xs text-[var(--color-mute)]">
                {portfolio ? `${portfolio.sol.toFixed(4)} SOL` : "loading SOL…"}
                {" · send SOL here to launch, nothing is free"}
              </p>
              {agent.token && (
                <a
                  className="mt-2 inline-block text-xs text-[var(--color-gold)]"
                  href={agent.token.pumpFunUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  ${agent.token.symbol} on pump.fun
                </a>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">Chat</p>
              <div className="mt-3 max-h-80 space-y-3 overflow-auto text-sm">
                {messages.map((m, i) => (
                  <div key={i}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-mute)]">
                      {m.role}
                    </p>
                    <pre className="whitespace-pre-wrap text-[13px] leading-6">{m.content}</pre>
                  </div>
                ))}
              </div>
              <form onSubmit={onChat} className="mt-3 flex gap-2">
                <input
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm"
                  placeholder="launch a token, quote a swap, check bag…"
                />
                <button className="rounded-full bg-[var(--color-ember)] px-4 py-2 text-xs font-medium text-black">
                  {busy === "chat" ? "…" : "Send"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                Launch · 90/10
              </p>
              {agent.token ? (
                <p className="mt-3 text-sm">This agent already minted ${agent.token.symbol}.</p>
              ) : (
                <form onSubmit={onLaunch} className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    required
                    value={launch.name}
                    onChange={(e) => setLaunch({ ...launch, name: e.target.value })}
                    placeholder="name"
                    className="rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm"
                  />
                  <input
                    required
                    value={launch.symbol}
                    onChange={(e) => setLaunch({ ...launch, symbol: e.target.value })}
                    placeholder="TICKER"
                    className="rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm"
                  />
                  <textarea
                    value={launch.description}
                    onChange={(e) => setLaunch({ ...launch, description: e.target.value })}
                    placeholder="description"
                    className="rounded-xl border border-[var(--color-line)] bg-black px-4 py-3 text-sm sm:col-span-2"
                  />
                  <button className="rounded-full bg-[var(--color-ember)] px-5 py-3 text-sm font-medium text-black sm:col-span-2">
                    {busy === "launch" ? "Broadcasting…" : "Launch on pump.fun"}
                  </button>
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">
                  Earnings
                </p>
                <button onClick={loadEarnings} className="text-xs text-[var(--color-gold)]">
                  {busy === "earn" ? "collecting…" : "collect 90/10"}
                </button>
              </div>
              <pre className="mt-3 overflow-auto text-[12px] text-[var(--color-mute)]">
                {earnings ? JSON.stringify(earnings, null, 2) : "no collect yet"}
              </pre>
            </section>

            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-gold)]">MCP</p>
              <pre className="mt-3 overflow-auto text-[12px] leading-6 text-[var(--color-gold)]">
{`{
  "mcpServers": {
    "bullclaw": {
      "type": "http",
      "url": "${origin}/api/mcp",
      "headers": { "Authorization": "Bearer ${key}" }
    }
  }
}`}
              </pre>
            </section>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-mute)]">Create an agent to open the pit.</p>
        )}
      </div>
    </div>
  );
}
