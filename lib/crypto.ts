import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { KEY_PREFIX } from "./config";

function masterKey(): Buffer {
  const raw = process.env.MASTER_KEY?.trim();
  if (!raw) throw new Error("MASTER_KEY is not set");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("MASTER_KEY must be 32-byte hex");
  return buf;
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function newApiKey(): string {
  return KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(packed: string): string {
  const buf = Buffer.from(packed, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
