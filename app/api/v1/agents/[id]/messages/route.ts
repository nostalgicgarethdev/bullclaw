import { ownedAgent, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";
import { mutate } from "@/lib/store";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ownedAgent(user, id);
    const messages = await mutate((s) => s.messages[id] ?? []);
    return json({ messages });
  } catch (e) {
    return fail((e as { status?: number }).status || 404, e instanceof Error ? e.message : "error");
  }
}
