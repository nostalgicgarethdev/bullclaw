import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { SOLANA_RPC } from "./config";
import { decryptSecret, encryptSecret } from "./crypto";

export function connection() {
  return new Connection(SOLANA_RPC, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });
}

export function platformKeypair(): Keypair | null {
  const raw = process.env.PLATFORM_SECRET_KEY?.trim();
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    } catch {
      return null;
    }
  }
}

export function platformAddress(): string | null {
  return platformKeypair()?.publicKey.toBase58() ?? null;
}

export function newWallet() {
  const kp = Keypair.generate();
  return {
    address: kp.publicKey.toBase58(),
    secretEnc: encryptSecret(bs58.encode(kp.secretKey)),
    keypair: kp,
  };
}

export function agentKeypair(secretEnc: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(decryptSecret(secretEnc)));
}

export function isPubkey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export async function solBalance(address: string): Promise<number> {
  const lamports = await connection().getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL;
}

export async function tokenHoldings(address: string) {
  const conn = connection();
  const owner = new PublicKey(address);
  const sol = await conn.getBalance(owner);
  const parsed = await conn.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
  const tokens = parsed.value
    .map((row) => {
      const info = row.account.data.parsed.info as {
        mint: string;
        tokenAmount: { uiAmount: number | null; decimals: number };
      };
      return {
        mint: info.mint,
        amount: info.tokenAmount.uiAmount ?? 0,
        decimals: info.tokenAmount.decimals,
      };
    })
    .filter((t) => t.amount > 0);
  return {
    address,
    sol: sol / LAMPORTS_PER_SOL,
    lamports: String(sol),
    tokens,
  };
}

export async function sendSol(from: Keypair, to: string, sol: number) {
  const conn = connection();
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: from.publicKey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: new PublicKey(to),
        lamports,
      }),
    ],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([from]);
  const sig = await conn.sendTransaction(tx, { maxRetries: 3 });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}
