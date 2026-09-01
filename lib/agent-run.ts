import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL, LAUNCH_MIN_SOL } from "./config";
import { platformAddress } from "./keys";
import { newId } from "./crypto";
import { collectAgentFees } from "./fees";
import { jupiterSwapTx, swapQuote, tokenSearch } from "./market";
import { createOnPump, lockNinetyTen, uploadMetadata } from "./pump";
import { isPubkey } from "./keys";
import { solBalance, tokenHoldings } from "./rpc";
import { agentKeypair, connection } from "./solana";
import { mutate } from "./store";
import type { Agent, ChatMessage, SkillId } from "./types";
import { VersionedTransaction } from "@solana/web3.js";

function modelId() {
  return process.env.XAI_API_KEY ? "xai/grok-4.5" : DEFAULT_MODEL;
}

async function launchForAgent(
  agent: Agent,
  input: {
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    twitter?: string;
    confirm: boolean;
    devBuySol?: number;
  },
) {
  if (!input.confirm) {
    return { needsConfirm: true, preview: { ...input, split: "90/10" } };
  }
  if (agent.token) return { error: "this agent already launched a token" };
  const house = platformAddress();
  if (!house) {
    return { error: "house payout address is not configured (PLATFORM_SECRET_KEY)" };
  }
  const symbol = input.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (symbol.length < 2) return { error: "symbol must be 2-10 chars" };
  const name = input.name.trim().slice(0, 32);
  const payer = agentKeypair(agent.secretEnc);
  const bal = await solBalance(agent.wallet);
  if (bal < LAUNCH_MIN_SOL) {
    return {
      error: `launch needs ~${LAUNCH_MIN_SOL} SOL on the agent wallet ${agent.wallet}. Fund that wallet — nothing is sponsored.`,
    };
  }
  const meta = await uploadMetadata({
    name,
    symbol,
    description:
      input.description?.trim() ||
      `${name} launched by ${agent.name} on BullClaw. Agent keeps 90% of creator fees.`,
    imageUrl: input.imageUrl,
    twitter: input.twitter,
    website: "https://bullclaw.bond",
  });
  const created = await createOnPump({
    payer,
    name,
    symbol,
    uri: meta.uri,
    devBuySol: input.devBuySol ?? 0,
  });
  let shareSig: string | null = null;
  try {
    shareSig = await lockNinetyTen(created.mint, payer, house);
  } catch (e) {
    shareSig = e instanceof Error ? `share failed: ${e.message}` : "share failed";
  }
  const token = {
    mint: created.mint,
    name,
    symbol,
    signature: created.signature,
    imageUrl: meta.imageUrl,
    pumpFunUrl: created.pumpFunUrl,
    launchedAt: Date.now(),
  };
  await mutate((s) => {
    const a = s.agents[agent.id];
    if (a) a.token = token;
    s.tokens.unshift({
      mint: token.mint,
      name,
      symbol,
      agentId: agent.id,
      agentName: agent.name,
      signature: created.signature,
      imageUrl: token.imageUrl,
      pumpFunUrl: token.pumpFunUrl,
      createdAt: token.launchedAt,
    });
  });
  return {
    ...created,
    feeShare: shareSig,
    split: "90% agent / 10% house",
    paidBy: agent.wallet,
    token,
  };
}

function toolsFor(agent: Agent) {
  const has = (id: SkillId) => agent.skills.includes(id);
  return {
    get_portfolio: tool({
      description: "SOL and SPL balances for this agent's wallet",
      inputSchema: z.object({}),
      execute: async () => tokenHoldings(agent.wallet),
    }),
    get_price: tool({
      description: "Look up a Solana token by ticker, name, or mint",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => (await tokenSearch(query)).slice(0, 5),
    }),
    token_search: tool({
      description: "Search live Solana / pump.fun markets",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => tokenSearch(query),
    }),
    swap_quote: tool({
      description: "Jupiter quote. Amount is in the smallest unit of inputMint, or pass amountSol for SOL.",
      inputSchema: z.object({
        inputMint: z.string().optional(),
        outputMint: z.string().optional(),
        amountSol: z.number().optional(),
        amount: z.string().optional(),
      }),
      execute: async (input) => swapQuote(input),
    }),
    swap_execute: tool({
      description: "Execute a Jupiter swap from the agent wallet. Requires confirm=true.",
      inputSchema: z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.string(),
        confirm: z.boolean(),
      }),
      execute: async (input) => {
        if (!has("defi-trading")) return { error: "defi-trading skill is off" };
        if (!input.confirm) return { needsConfirm: true };
        const kp = agentKeypair(agent.secretEnc);
        const built = await jupiterSwapTx({
          userPublicKey: kp.publicKey.toBase58(),
          inputMint: input.inputMint,
          outputMint: input.outputMint,
          amount: input.amount,
        });
        const tx = VersionedTransaction.deserialize(
          Buffer.from(built.swapTransaction, "base64"),
        );
        tx.sign([kp]);
        const sig = await connection().sendTransaction(tx, { maxRetries: 3 });
        return { signature: sig };
      },
    }),
    get_launch_status: tool({
      description: "Whether this agent can launch. Agent wallet pays gas. Nothing is sponsored.",
      inputSchema: z.object({}),
      execute: async () => {
        const sol = await solBalance(agent.wallet);
        return {
          alreadyLaunched: Boolean(agent.token),
          token: agent.token ?? null,
          launchMinSol: LAUNCH_MIN_SOL,
          agentWallet: agent.wallet,
          agentSol: sol,
          funded: sol >= LAUNCH_MIN_SOL,
          house: platformAddress(),
          split: "90/10",
        };
      },
    }),
    launch_token: tool({
      description:
        "Launch a pump.fun token for this agent. Agent wallet pays rent and gas. confirm=true required. Locks 90% fees to the agent wallet, 10% house.",
      inputSchema: z.object({
        name: z.string(),
        symbol: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        twitter: z.string().optional(),
        devBuySol: z.number().optional(),
        confirm: z.boolean(),
      }),
      execute: async (input) => {
        if (!has("token-launch")) return { error: "token-launch skill is off" };
        return launchForAgent(agent, input);
      },
    }),
    get_earnings: tool({
      description: "Creator fee earnings and last 90/10 distributions",
      inputSchema: z.object({}),
      execute: async () => collectAgentFees(agent),
    }),
    get_whitelist: tool({
      description: "Addresses this agent may send funds to",
      inputSchema: z.object({}),
      execute: async () => agent.whitelist,
    }),
    add_to_whitelist: tool({
      description: "Allow an address to receive funds from this agent",
      inputSchema: z.object({
        address: z.string(),
        label: z.string().optional(),
      }),
      execute: async ({ address, label }) => {
        if (!isPubkey(address)) return { error: "invalid solana address" };
        await mutate((s) => {
          const a = s.agents[agent.id];
          if (!a) return;
          if (a.whitelist.some((w) => w.address === address)) return;
          a.whitelist.push({ address, label, addedAt: Date.now() });
        });
        return { ok: true, address, label };
      },
    }),
  };
}

export async function chatWithAgent(agent: Agent, message: string) {
  const history = await mutate((s) => s.messages[agent.id] ?? []);
  const userMsg: ChatMessage = {
    id: newId(),
    agentId: agent.id,
    role: "user",
    content: message,
    at: Date.now(),
  };
  const prior = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-16)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const system = `You are ${agent.name}, a BullClaw agent on Solana.
Persona: ${agent.persona || "Direct, on-chain, no fluff."}
Wallet: ${agent.wallet}
Skills: ${agent.skills.join(", ")}
Creator fee split on every BullClaw launch: 90% to this agent wallet, 10% to the house.
Use tools for balances, prices, quotes, launches, and earnings. Never claim a launch succeeded unless a tool returned a mint and signature.
Sensitive actions (launch_token, swap_execute) need confirm=true after the user agrees.
If the platform treasury is empty, say so and give the deposit address.`;

  let text = "";
  let tools: ChatMessage["tools"] = [];
  try {
    const result = await generateText({
      model: modelId(),
      system,
      messages: [...prior, { role: "user", content: message }],
      tools: toolsFor(agent),
      stopWhen: stepCountIs(6),
    });
    text = result.text || "done.";
    tools = result.steps.flatMap((step) =>
      (step.toolResults ?? []).map((tr) => ({
        name: String(tr.toolName),
        input: tr.input,
        output: tr.output,
      })),
    );
  } catch (e) {
    text = `model error: ${e instanceof Error ? e.message : "unknown"}. Tools still work from the dashboard and MCP.`;
  }

  const assistant: ChatMessage = {
    id: newId(),
    agentId: agent.id,
    role: "assistant",
    content: text,
    at: Date.now(),
    tools,
  };
  await mutate((s) => {
    const list = s.messages[agent.id] ?? [];
    list.push(userMsg, assistant);
    s.messages[agent.id] = list.slice(-80);
  });
  return { reply: text, tools, messageId: assistant.id };
}

export { launchForAgent };
