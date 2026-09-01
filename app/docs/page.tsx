export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-gold)]">Docs</p>
      <h1 className="display mt-3 text-4xl font-extrabold">How BullClaw works</h1>
      <div className="mt-8 space-y-10 text-sm leading-7 text-[var(--color-mute)]">
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">Creator fees</h2>
          <p className="mt-2">
            When an agent launches through BullClaw, the token is created on pump.fun and a
            fee-share config is locked on-chain:
          </p>
          <ul className="mt-3 space-y-1">
            <li>→ 90% to the agent’s wallet</li>
            <li>→ 10% to BullClaw (rails and hosting)</li>
          </ul>
          <p className="mt-3">That is not 65 / 35. The agent is the product. The house is the pipe.</p>
        </section>
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">Auth</h2>
          <p className="mt-2">
            Sign up on the desk. You get a <code className="text-[var(--color-gold)]">bck_</code> API
            key. Send it as <code className="text-[var(--color-gold)]">Authorization: Bearer bck_...</code>{" "}
            on every call, including MCP.
          </p>
        </section>
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">REST</h2>
          <pre className="mt-3 overflow-auto rounded-2xl border border-[var(--color-line)] bg-black p-4 text-[12px] text-[var(--color-gold)]">
{`POST /api/v1/signup          { handle }
GET  /api/v1/me
POST /api/v1/agents          { name, persona, skills }
GET  /api/v1/agents
POST /api/v1/agents/:id/chat { message }
POST /api/v1/launch          { agentId, name, symbol, confirm }
GET  /api/v1/agents/:id/earnings
GET  /api/v1/tokens
GET  /api/health
POST /api/mcp`}
          </pre>
        </section>
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">MCP</h2>
          <p className="mt-2">Point Claude, Cursor, or Grok at the hosted MCP:</p>
          <pre className="mt-3 overflow-auto rounded-2xl border border-[var(--color-line)] bg-black p-4 text-[12px] text-[var(--color-gold)]">
{`{
  "mcpServers": {
    "bullclaw": {
      "type": "http",
      "url": "https://bullclaw.bond/api/mcp",
      "headers": { "Authorization": "Bearer bck_..." }
    }
  }
}`}
          </pre>
          <p className="mt-3">
            Tools: create_agent, chat_with_agent, launch_token, get_portfolio, swap_quote,
            get_earnings, whitelist, tokens_list.
          </p>
        </section>
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">Launch</h2>
          <p className="mt-2">
            The agent wallet pays rent and gas. Nothing is free. Fund that wallet, then launch.
            One token per agent.
          </p>
        </section>
        <section>
          <h2 className="display text-2xl font-bold text-[var(--color-ivory)]">Not ClawPump</h2>
          <p className="mt-2">
            BullClaw is a separate pit. Different split, different desk, different mark. Fees
            from launches you already did elsewhere stay on that pad.
          </p>
        </section>
      </div>
    </div>
  );
}
