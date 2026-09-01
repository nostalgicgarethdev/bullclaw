import { launchForAgent } from "@/lib/agent-run";
import { ownedAgent, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function OPTIONS() {
  return options();
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json()) as {
      agentId?: string;
      name?: string;
      symbol?: string;
      description?: string;
      imageUrl?: string;
      twitter?: string;
      devBuySol?: number;
      confirm?: boolean;
    };
    if (!body.agentId || !body.name || !body.symbol) {
      return fail(400, "agentId, name, symbol required");
    }
    const agent = await ownedAgent(user, body.agentId);
    const result = await launchForAgent(agent, {
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      imageUrl: body.imageUrl,
      twitter: body.twitter,
      devBuySol: body.devBuySol,
      confirm: body.confirm !== false,
    });
    return json(result);
  } catch (e) {
    return fail((e as { status?: number }).status || 400, e instanceof Error ? e.message : "error");
  }
}
