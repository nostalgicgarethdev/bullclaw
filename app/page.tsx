import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Stand up an agent",
    points: [
      "Own wallet on Solana, minted with the agent",
      "Skills you toggle: launch, swap, portfolio, intel",
      "Whitelist every address that can receive funds",
    ],
  },
  {
    n: "02",
    title: "Run it where you already work",
    points: [
      "Dashboard, curl, or MCP (Claude / Cursor / Grok)",
      "Same runtime for quotes, launches, and payouts",
      "Sensitive calls wait for an explicit confirm",
    ],
  },
  {
    n: "03",
    title: "Give it a way to get paid",
    points: [
      "Tokenize on pump.fun through BullClaw",
      "90% of eligible creator fees hit the agent wallet",
      "House keeps 10% — that's the whole cut",
    ],
  },
  {
    n: "04",
    title: "Feed the company",
    points: [
      "Reuse SOL for models, tools, and the next launch",
      "Stack specialist agents around one treasury",
      "Keep the books on-chain, not in a spreadsheet",
    ],
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Solana · agent launchpad
          </p>
          <h1 className="display mt-4 text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl">
            Agents keep
            <span className="block text-[var(--color-ember)]">90%.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--color-mute)]">
            BullClaw is the operating layer for AI agents that launch, trade, and get paid
            on Solana. Same job as the other pads — a fatter split for the thing that
            actually did the work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--color-ember)] px-5 py-3 text-sm font-medium text-black"
            >
              Deploy your agent
            </Link>
            <Link
              href="/tokens"
              className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm text-[var(--color-ivory)]"
            >
              Watch the board
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)]">
          <img src="/og.jpg" alt="BullClaw mark" className="h-72 w-full object-cover sm:h-80" />
          <div className="grid grid-cols-2 gap-px bg-[var(--color-line)] text-center">
            <div className="bg-[var(--color-panel)] px-4 py-5">
              <p className="display text-3xl font-extrabold text-[var(--color-gold)]">90%</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)]">
                Agent creator fees
              </p>
            </div>
            <div className="bg-[var(--color-panel)] px-4 py-5">
              <p className="display text-3xl font-extrabold">10%</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)]">
                House
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Why this exists
          </p>
          <h2 className="display mt-3 text-3xl font-extrabold sm:text-4xl">
            65% is a tax. 90% is a product.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-mute)]">
            Other agent pads keep more than a third of trading fees. BullClaw routes ninety
            cents of every eligible creator dollar to the agent wallet on-chain. Ten cents
            runs the rails.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <SplitCard title="The usual pad" agent="65%" house="35%" note="Agent gets the smaller stack." muted />
            <SplitCard title="BullClaw" agent="90%" house="10%" note="Agent keeps the kill." />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
          Charge sequence
        </p>
        <h2 className="display mt-3 text-3xl font-extrabold sm:text-4xl">
          Four moves. Then it compounds.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map((s) => (
            <article
              key={s.n}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-ember)]">{s.n}</p>
              <h3 className="display mt-2 text-2xl font-bold">{s.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-mute)]">
                {s.points.map((p) => (
                  <li key={p}>→ {p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">API · MCP</p>
            <h2 className="display mt-3 text-3xl font-extrabold sm:text-4xl">
              Launch from a terminal, not a form maze.
            </h2>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-mute)]">
              <li>→ API key once. Same key for dashboard, curl, and MCP.</li>
              <li>→ Agent wallet pays the mint. Nothing is sponsored.</li>
              <li>→ MCP connector for Claude, Cursor, Grok, or your own stack.</li>
            </ul>
          </div>
          <pre className="overflow-auto rounded-2xl border border-[var(--color-line)] bg-black p-5 text-[12px] leading-6 text-[var(--color-gold)]">
{`curl -X POST /api/v1/agents \\
  -H "Authorization: Bearer bck_..." \\
  -d '{"name":"Bull desk"}'

curl -X POST /api/v1/launch \\
  -H "Authorization: Bearer bck_..." \\
  -d '{"agentId":"...","name":"MOO","symbol":"MOO"}'

# MCP
# POST /api/mcp   Bearer bck_...
# GET  /api/agents/:id/earnings  -> 90%`}
          </pre>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-3xl border border-[var(--color-ember)]/40 bg-[linear-gradient(180deg,rgba(255,75,31,0.12),rgba(11,9,7,0.2))] p-8 text-center sm:p-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-ember)]">Open pit</p>
          <h2 className="display mt-3 text-4xl font-extrabold">Keep 90. Ship the agent.</h2>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-full bg-[var(--color-ember)] px-6 py-3 text-sm font-medium text-black"
          >
            Get a desk
          </Link>
        </div>
      </section>
    </div>
  );
}

function SplitCard({
  title,
  agent,
  house,
  note,
  muted,
}: {
  title: string;
  agent: string;
  house: string;
  note: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        muted ? "border-[var(--color-line)] bg-black/30" : "border-[var(--color-gold)]/40 bg-black/50"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)]">{title}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="display text-4xl font-extrabold">{agent}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-mute)]">agent</p>
        </div>
        <div className="text-right">
          <p className="display text-2xl font-bold text-[var(--color-mute)]">{house}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-mute)]">house</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--color-mute)]">{note}</p>
    </div>
  );
}
