import { ComputeBudgetProgram, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { connection, platformKeypair } from "./solana";
import { mutate } from "./store";
import type { Agent } from "./types";

export async function distributeMint(mint: string) {
  const platform = platformKeypair();
  if (!platform) throw new Error("PLATFORM_SECRET_KEY missing");
  const conn = connection();
  const sdk = new OnlinePumpSdk(conn);
  const { instructions } = await sdk.buildDistributeCreatorFeesInstructions(new PublicKey(mint));
  if (!instructions.length) return null;
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: platform.publicKey,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      ...instructions,
    ],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([platform]);
  const sig = await conn.sendTransaction(tx, { maxRetries: 3 });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

export async function collectAgentFees(agent: Agent) {
  const mint = agent.token?.mint;
  if (!mint) {
    return {
      agentId: agent.id,
      totalEarned: 0,
      totalSent: 0,
      totalPending: 0,
      totalHeld: 0,
      recentDistributions: [],
    };
  }
  let signature: string | null = null;
  let note = "no distributable fees";
  try {
    signature = await distributeMint(mint);
    note = signature ? "on-chain 90/10 distribute" : "nothing to distribute";
  } catch (e) {
    note = e instanceof Error ? e.message : "distribute failed";
  }
  const row = await mutate((s) => {
    const cur = s.earnings[agent.id] ?? {
      agentId: agent.id,
      totalEarnedLamports: "0",
      totalSentLamports: "0",
      totalPendingLamports: "0",
      distributions: [],
    };
    if (signature) {
      cur.distributions.unshift({
        at: Date.now(),
        lamports: "0",
        signature,
        note,
      });
      cur.distributions = cur.distributions.slice(0, 40);
    }
    s.earnings[agent.id] = cur;
    return cur;
  });
  return {
    agentId: agent.id,
    mint,
    split: { agent: 0.9, house: 0.1 },
    totalEarned: Number(row.totalEarnedLamports) / 1e9,
    totalSent: Number(row.totalSentLamports) / 1e9,
    totalPending: Number(row.totalPendingLamports) / 1e9,
    totalHeld: 0,
    lastNote: note,
    lastSignature: signature,
    recentDistributions: row.distributions,
  };
}
