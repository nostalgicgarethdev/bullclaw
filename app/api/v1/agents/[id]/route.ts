import { ownedAgent, publicAgent, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";
import { mutate } from "@/lib/store";
import type { SkillId } from "@/lib/types";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    return json({ agent: publicAgent(await ownedAgent(user, id)) });
  } catch (e) {
    return fail((e as { status?: number }).status || 404, e instanceof Error ? e.message : "error");
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ownedAgent(user, id);
    const body = (await req.json()) as {
      name?: string;
      persona?: string;
      skills?: SkillId[];
      status?: "running" | "stopped";
    };
    const agent = await mutate((s) => {
      const a = s.agents[id];
      if (body.name) a.name = body.name.slice(0, 40);
      if (body.persona !== undefined) a.persona = body.persona;
      if (body.skills) a.skills = body.skills;
      if (body.status) a.status = body.status;
      return a;
    });
    return json({ agent: publicAgent(agent) });
  } catch (e) {
    return fail((e as { status?: number }).status || 400, e instanceof Error ? e.message : "error");
  }
}
