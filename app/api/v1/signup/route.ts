import { signup } from "@/lib/auth";
import { fail, json, options } from "@/lib/http";

export const runtime = "nodejs";
export async function OPTIONS() {
  return options();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { handle?: string };
    const out = await signup(body.handle || "");
    return json({
      user: { id: out.user.id, handle: out.user.handle },
      apiKey: out.apiKey,
      note: "store this key. it is not shown again.",
    });
  } catch (e) {
    const status = (e as { status?: number }).status || 400;
    return fail(status, e instanceof Error ? e.message : "signup failed");
  }
}
