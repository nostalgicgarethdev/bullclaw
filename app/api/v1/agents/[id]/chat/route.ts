import { chatWithAgent } from "@/lib/agent-run";
import { ownedAgent, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function OPTIONS() {
  return options();
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const agent = await ownedAgent(user, id);
    const body = (await req.json()) as { message?: string };
    const message = body.message?.trim();
    if (!message) return fail(400, "message required");
    const out = await chatWithAgent(agent, message);
    return json(out);
  } catch (e) {
    return fail((e as { status?: number }).status || 400, e instanceof Error ? e.message : "error");
  }
}
