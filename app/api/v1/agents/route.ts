import { agentsFor, publicAgent, requireUser } from "@/lib/auth";
import { DEFAULT_MODEL, SKILLS } from "@/lib/config";
import { newId } from "@/lib/crypto";
import { fail, json, options } from "@/lib/http";
import { newWallet } from "@/lib/keys";
import { mutate } from "@/lib/store";
import type { SkillId } from "@/lib/types";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    return json({ agents: (await agentsFor(user.id)).map(publicAgent) });
  } catch (e) {
    return fail((e as { status?: number }).status || 401, e instanceof Error ? e.message : "error");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json()) as {
      name?: string;
      persona?: string;
      skills?: SkillId[];
    };
    const name = body.name?.trim().slice(0, 40);
    if (!name) return fail(400, "name required");
    const wallet = newWallet();
    const skills =
      body.skills?.length ? body.skills : (SKILLS.map((s) => s.id) as SkillId[]);
    const agent = await mutate((s) => {
      const row = {
        id: newId(),
        userId: user.id,
        name,
        persona: body.persona?.trim() || "Direct Solana agent. Launch, quote, get paid.",
        model: DEFAULT_MODEL,
        skills,
        wallet: wallet.address,
        secretEnc: wallet.secretEnc,
        status: "running" as const,
        whitelist: [],
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
    return json({ agent: publicAgent(agent) }, 201);
  } catch (e) {
    return fail((e as { status?: number }).status || 400, e instanceof Error ? e.message : "error");
  }
}
