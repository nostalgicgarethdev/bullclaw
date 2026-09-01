import bs58 from "bs58";
import nacl from "tweetnacl";
import { decryptSecret, encryptSecret } from "./crypto";

export function encodePk(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

export function decodePk(s: string): Uint8Array {
  return bs58.decode(s);
}

export function newWallet() {
  const kp = nacl.sign.keyPair();
  return {
    address: encodePk(kp.publicKey),
    secretEnc: encryptSecret(encodePk(kp.secretKey)),
    secretKey: kp.secretKey,
    publicKey: kp.publicKey,
  };
}

export function secretBytes(secretEnc: string): Uint8Array {
  return decodePk(decryptSecret(secretEnc));
}

export function platformSecret(): Uint8Array | null {
  const raw = process.env.PLATFORM_SECRET_KEY?.trim();
  if (!raw) return null;
  try {
    return decodePk(raw);
  } catch {
    return null;
  }
}

export function platformAddress(): string | null {
  const secret = platformSecret();
  if (!secret || secret.length < 64) return null;
  return encodePk(secret.slice(32));
}

export function isPubkey(value: string): boolean {
  try {
    const b = decodePk(value);
    return b.length === 32;
  } catch {
    return false;
  }
}
