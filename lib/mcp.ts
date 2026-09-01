import { agentsFor, ownedAgent, publicAgent, signup, userFromKey } from "./auth";
import { chatWithAgent, launchForAgent } from "./agent-run";
import { SKILLS } from "./config";
import { collectAgentFees } from "./fees";
import { swapQuote, tokenSearch } from "./market";
import { newId } from "./crypto";
import { DEFAULT_MODEL } from "./config";
import { platformAddress, solBalance, tokenHoldings, newWallet } from "./solana";
import { mutate } from "./store";
import type { SkillId } from "./types";

const TOOLS = [
  { name: "list_agents", description: "List your BullClaw agents" },
  { name: "get_agent", description: "Get one agent by id" },
  { name: "create_agent", description: "Create an agent with a Solana wallet" },
  { name: "chat_with_agent", description: "Send a message to an agent" },
  { name: "get_chat_history", description: "Recent chat for an agent" },
  { name: "get_launch_status", description: "Launch readiness and sponsored slots" },
  { name: "launch_token", description: "Launch on pump.fun with 90/10 fee lock" },
  { name: "get_portfolio", description: "Agent wallet holdings" },
  { name: "get_price", description: "Token search / price" },
  { name: "token_search", description: "Search Solana tokens" },
  { name: "swap_quote", description: "Jupiter swap quote" },
  { name: "get_earnings", description: "Creator fee earnings (90%)" },
  { name: "get_whitelist", description: "Whitelisted payout addresses" },
  { name: "add_to_whitelist", description: "Allow an address to receive funds" },
  { name: "platform_health", description: "API + treasury status" },
  { name: "tokens_list", description: "Tokens launched through BullClaw" },
  { name: "signup", description: "Create a desk and API key (handle required)" },
];

function schema(properties: Record<string, unknown>, required: string[] = []) {
  return { type: "object", properties, required };
}

function toolSchema(name: string) {
  const agentId = { type: "string", description: "Agent id" };
  switch (name) {
    case "create_agent":
      return schema(
        {
          name: { type: "string" },
          persona: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
        },
        ["name"],
      );
    case "chat_with_agent":
      return schema({ agentId, message: { type: "string" } }, ["agentId", "message"]);
    case "get_agent":
    case "get_chat_history":
    case "get_launch_status":
    case "get_portfolio":
    case "get_earnings":
    case "get_whitelist":
      return schema({ agentId }, ["agentId"]);
    case "launch_token":
      return schema(
        {
          agentId,
          name: { type: "string" },
          symbol: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          confirm: { type: "boolean" },
        },
        ["agentId", "name", "symbol", "confirm"],
      );
    case "get_price":
    case "token_search":
      return schema({ query: { type: "string" } }, ["query"]);
    case "swap_quote":
      return schema({
        inputMint: { type: "string" },
        outputMint: { type: "string" },
        amountSol: { type: "number" },
      });
    case "add_to_whitelist":
      return schema({ agentId, address: { type: "string" }, label: { type: "string" } }, [
        "agentId",
        "address",
      ]);
    case "signup":
      return schema({ handle: { type: "string" } }, ["handle"]);
    default:
      return schema({});
  }
}

async function callTool(name: string, args: Record<string, unknown>, apiKey: string) {
  if (name === "signup") {
    const out = await signup(String(args.handle || ""));
    return { ...out.user, apiKey: out.apiKey };
  }
  if (name === "platform_health") {
    const addr = platformAddress();
    return {
      ok: true,
      split: "90/10",
      platform: addr,
      platformSol: addr ? await solBalance(addr) : 0,
    };
  }
  if (name === "tokens_list") {
    return mutate((s) => s.tokens.slice(0, 50));
  }
  if (name === "token_search" || name === "get_price") {
    return tokenSearch(String(args.query || "pump.fun"));
  }
  if (name === "swap_quote") {
    return swapQuote({
      inputMint: args.inputMint as string | undefined,
      outputMint: args.outputMint as string | undefined,
      amountSol: args.amountSol as number | undefined,
    });
  }

  const user = await userFromKey(apiKey);
  if (!user) return { error: "unauthorized — pass Authorization: Bearer bck_..." };

  if (name === "list_agents") {
    return (await agentsFor(user.id)).map(publicAgent);
  }
  if (name === "create_agent") {
    const wallet = newWallet();
    const skills = (Array.isArray(args.skills) ? args.skills : SKILLS.map((s) => s.id)) as SkillId[];
    const agent = await mutate((s) => {
      const row = {
        id: newId(),
        userId: user.id,
        name: String(args.name || "agent").slice(0, 40),
        persona: String(args.persona || ""),
        model: DEFAULT_MODEL,
        skills: skills.length ? skills : (SKILLS.map((s) => s.id) as SkillId[]),
        wallet: wallet.address,
        secretEnc: wallet.secretEnc,
        status: "running" as const,
        whitelist: [] as { address: string; addedAt: number }[],
        createdAt: Date.now(),
      };
      s.agents[row.id] = row;
      s.messages[row.id] = [];
      s.earnings[row.id] = {
        agentId: row.id,
        totalEarnedLamports: "0",
        totalSentLamports: "0",
        totalPendingLamports: "0",
        distributions: [],
      };
      return row;
    });
    return publicAgent(agent);
  }

  const agent = await ownedAgent(user, String(args.agentId || ""));
  if (name === "get_agent") return publicAgent(agent);
  if (name === "chat_with_agent") return chatWithAgent(agent, String(args.message || ""));
  if (name === "get_chat_history") {
    return mutate((s) => (s.messages[agent.id] ?? []).slice(-40));
  }
  if (name === "get_launch_status") {
    return {
      token: agent.token ?? null,
      wallet: agent.wallet,
      sol: await solBalance(agent.wallet),
      sponsoredRemaining: Math.max(0, 3 - user.sponsoredLaunchesUsed),
    };
  }
  if (name === "launch_token") {
    return launchForAgent(agent, {
      name: String(args.name || ""),
      symbol: String(args.symbol || ""),
      description: args.description as string | undefined,
      imageUrl: args.imageUrl as string | undefined,
      confirm: Boolean(args.confirm),
    });
  }
  if (name === "get_portfolio") return tokenHoldings(agent.wallet);
  if (name === "get_earnings") return collectAgentFees(agent);
  if (name === "get_whitelist") return agent.whitelist;
  if (name === "add_to_whitelist") {
    return mutate((s) => {
      const a = s.agents[agent.id];
      const address = String(args.address);
      if (!a.whitelist.some((w) => w.address === address)) {
        a.whitelist.push({
          address,
          label: args.label as string | undefined,
          addedAt: Date.now(),
        });
      }
      return a.whitelist;
    });
  }
  return { error: `unknown tool ${name}` };
}

export async function handleMcp(body: {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
}, apiKey: string) {
  const id = body.id ?? 1;
  const method = body.method || "";
  const params = body.params || {};
  try {
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: "bullclaw", version: "0.1.0" },
        },
      };
    }
    if (method === "notifications/initialized") {
      return { jsonrpc: "2.0", id, result: {} };
    }
    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: toolSchema(t.name),
          })),
        },
      };
    }
    if (method === "tools/call") {
      const name = String(params.name || "");
      const args = (params.arguments || {}) as Record<string, unknown>;
      const result = await callTool(name, args, apiKey);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      };
    }
    if (method === "resources/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          resources: [
            { uri: "bullclaw://me", name: "Account" },
            { uri: "bullclaw://agents", name: "Agents" },
            { uri: "bullclaw://tokens", name: "Launched tokens" },
          ],
        },
      };
    }
    if (method === "prompts/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          prompts: [
            { name: "get-started", description: "Create a desk and first agent" },
            { name: "launch-token", description: "Launch on pump.fun at 90/10" },
          ],
        },
      };
    }
    if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `unknown method ${method}` },
    };
  } catch (e) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message: e instanceof Error ? e.message : "error" },
    };
  }
}
