import { ownedAgent, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";
import { isPubkey } from "@/lib/keys";
import { mutate } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const agent = await ownedAgent(user, id);
    return json({ whitelist: agent.whitelist });
  } catch (e) {
    return fail((e as { status?: number }).status || 404, e instanceof Error ? e.message : "error");
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ownedAgent(user, id);
    const body = (await req.json()) as { address?: string; label?: string };
    if (!body.address || !isPubkey(body.address)) return fail(400, "valid address required");
    const whitelist = await mutate((s) => {
      const a = s.agents[id];
      if (!a.whitelist.some((w) => w.address === body.address)) {
        a.whitelist.push({ address: body.address!, label: body.label, addedAt: Date.now() });
      }
      return a.whitelist;
    });
    return json({ whitelist });
  } catch (e) {
    return fail((e as { status?: number }).status || 400, e instanceof Error ? e.message : "error");
  }
}
