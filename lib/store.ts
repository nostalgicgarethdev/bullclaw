import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { Store } from "./types";

const BLOB_PATH = "bullclaw/store.json";

function empty(): Store {
  return {
    users: {},
    agents: {},
    keys: {},
    messages: {},
    tokens: [],
    earnings: {},
    updatedAt: Date.now(),
  };
}

function filePath() {
  if (process.env.VERCEL) return "/tmp/bullclaw-store.json";
  return join(process.cwd(), ".data", "store.json");
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
}

let cache: Store | null = null;
let hydratePromise: Promise<Store> | null = null;
let saveChain: Promise<void> = Promise.resolve();

function merge(raw: Partial<Store> | null | undefined): Store {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  return {
    users: raw.users && typeof raw.users === "object" ? raw.users : {},
    agents: raw.agents && typeof raw.agents === "object" ? raw.agents : {},
    keys: raw.keys && typeof raw.keys === "object" ? raw.keys : {},
    messages: raw.messages && typeof raw.messages === "object" ? raw.messages : {},
    tokens: Array.isArray(raw.tokens) ? raw.tokens : [],
    earnings: raw.earnings && typeof raw.earnings === "object" ? raw.earnings : {},
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
  };
}

async function loadFromBlob(): Promise<Store | null> {
  const token = blobToken();
  if (!token) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 5, token });
    const hit = blobs.find((b) => b.pathname === BLOB_PATH) || blobs[0];
    if (!hit?.url) return null;
    const res = await fetch(hit.url);
    if (!res.ok) return null;
    return merge((await res.json()) as Partial<Store>);
  } catch (e) {
    console.error("blob load failed", e instanceof Error ? e.message : e);
    return null;
  }
}

function loadFromFile(): Store {
  const p = filePath();
  try {
    if (!existsSync(p)) return empty();
    return merge(JSON.parse(readFileSync(p, "utf8")) as Partial<Store>);
  } catch {
    return empty();
  }
}

async function saveToBlob(store: Store) {
  const token = blobToken();
  if (!token) return;
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(store), {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function saveToFile(store: Store) {
  const p = filePath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(store, null, 2));
}

export async function ensureStore(): Promise<Store> {
  if (cache) return cache;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const fromBlob = await loadFromBlob();
    cache = fromBlob ?? loadFromFile();
    return cache;
  })();
  try {
    return await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

export async function flushStore() {
  if (!cache) return;
  const snapshot = cache;
  saveChain = saveChain.then(async () => {
    saveToFile(snapshot);
    await saveToBlob(snapshot);
  });
  await saveChain;
}

export async function mutate<T>(fn: (s: Store) => T | Promise<T>): Promise<T> {
  const s = await ensureStore();
  const result = await fn(s);
  s.updatedAt = Date.now();
  await flushStore();
  return result;
}
