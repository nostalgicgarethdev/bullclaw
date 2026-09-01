import { LAMPORTS_PER_SOL, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_RPC } from "./config";
import { decryptSecret } from "./crypto";
import { decodePk, platformSecret } from "./keys";

export { isPubkey, newWallet, platformAddress } from "./keys";
export { solBalance, tokenHoldings } from "./rpc";

export function connection() {
  return new Connection(SOLANA_RPC, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });
}

export function platformKeypair(): Keypair | null {
  const secret = platformSecret();
  if (!secret) return null;
  try {
    return Keypair.fromSecretKey(secret);
  } catch {
    return null;
  }
}

export function agentKeypair(secretEnc: string): Keypair {
  return Keypair.fromSecretKey(decodePk(decryptSecret(secretEnc)));
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
