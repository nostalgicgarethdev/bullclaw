import { KEY_PREFIX } from "./config";
import { hashKey, newApiKey, newId } from "./crypto";
import { ensureStore, mutate } from "./store";
import type { Agent, User } from "./types";

export function readKey(req: Request): string {
  const header = req.headers.get("authorization") || "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  return new URL(req.url).searchParams.get("key")?.trim() || "";
}

export async function userFromKey(key: string): Promise<User | null> {
  if (!key.startsWith(KEY_PREFIX)) return null;
  const s = await ensureStore();
  const userId = s.keys[hashKey(key)];
  if (!userId) return null;
  return s.users[userId] ?? null;
}

export async function requireUser(req: Request): Promise<User> {
  const key = readKey(req);
  const user = await userFromKey(key);
  if (!user) {
    const err = new Error("unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}

export async function signup(handle: string) {
  const clean = handle.replace(/^@/, "").trim().slice(0, 40);
  if (clean.length < 2) throw new Error("handle too short");
  const key = newApiKey();
  const user = await mutate((s) => {
    const existing = Object.values(s.users).find(
      (u) => u.handle.toLowerCase() === clean.toLowerCase(),
    );
    if (existing) {
      const err = new Error("handle taken — sign in with your API key");
      (err as Error & { status: number }).status = 409;
      throw err;
    }
    const user: User = {
      id: newId(),
      handle: clean,
      createdAt: Date.now(),
      keyHash: hashKey(key),
      keyPrefix: key.slice(0, 10),
      sponsoredLaunchesUsed: 0,
    };
    s.users[user.id] = user;
    s.keys[user.keyHash] = user.id;
    return user;
  });
  return { user, apiKey: key };
}

export async function agentsFor(userId: string): Promise<Agent[]> {
  const s = await ensureStore();
  return Object.values(s.agents)
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function ownedAgent(user: User, id: string): Promise<Agent> {
  const s = await ensureStore();
  const agent = s.agents[id];
  if (!agent || agent.userId !== user.id) {
    const err = new Error("agent not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }
  return agent;
}

export function publicAgent(agent: Agent) {
  return {
    id: agent.id,
    name: agent.name,
    persona: agent.persona,
    model: agent.model,
    skills: agent.skills,
    wallet: agent.wallet,
    status: agent.status,
    whitelist: agent.whitelist,
    token: agent.token,
    createdAt: agent.createdAt,
    split: { agent: 0.9, house: 0.1 },
  };
}
