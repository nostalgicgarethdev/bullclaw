import { agentsFor, requireUser } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";
import { publicAgent } from "@/lib/auth";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const agents = (await agentsFor(user.id)).map(publicAgent);
    return json({
      id: user.id,
      handle: user.handle,
      sponsoredLaunchesUsed: user.sponsoredLaunchesUsed,
      sponsoredRemaining: Math.max(0, 3 - user.sponsoredLaunchesUsed),
      agents,
    });
  } catch (e) {
    const status = (e as { status?: number }).status || 401;
    return fail(status, e instanceof Error ? e.message : "unauthorized");
  }
}
