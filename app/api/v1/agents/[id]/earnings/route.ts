import { ownedAgent, requireUser } from "@/lib/auth";
import { collectAgentFees } from "@/lib/fees";
import { fail, json, options } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const agent = await ownedAgent(user, id);
    return json(await collectAgentFees(agent));
  } catch (e) {
    return fail((e as { status?: number }).status || 404, e instanceof Error ? e.message : "error");
  }
}
