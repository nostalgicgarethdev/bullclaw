import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { PUMP_SDK } from "@pump-fun/pump-sdk";
import { AGENT_SHARE_BPS, HOUSE_SHARE_BPS } from "./config";
import { connection } from "./solana";

export async function uploadMetadata(params: {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): Promise<{ uri: string; imageUrl?: string }> {
  let imageUrl = params.imageUrl;
  if (!imageUrl) {
    imageUrl = `https://picsum.photos/seed/${encodeURIComponent(params.symbol + params.name)}/512/512`;
  }
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`image fetch failed (${imgRes.status})`);
  const imgBuf = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") || "image/png";

  const form = new FormData();
  form.append("file", new Blob([imgBuf], { type: contentType }), "image");
  form.append("name", params.name);
  form.append("symbol", params.symbol);
  form.append("description", params.description.slice(0, 2000));
  form.append("showName", "true");
  if (params.twitter) form.append("twitter", params.twitter);
  if (params.telegram) form.append("telegram", params.telegram);
  if (params.website) form.append("website", params.website);

  const ipfsRes = await fetch("https://pump.fun/api/ipfs", { method: "POST", body: form });
  if (!ipfsRes.ok) {
    throw new Error(`pump.fun ipfs failed: ${ipfsRes.status} ${await ipfsRes.text()}`);
  }
  const json = (await ipfsRes.json()) as { metadataUri?: string; uri?: string };
  const uri = json.metadataUri || json.uri;
  if (!uri) throw new Error("pump.fun ipfs returned no uri");
  return { uri, imageUrl };
}

export async function createOnPump(params: {
  payer: Keypair;
  name: string;
  symbol: string;
  uri: string;
  devBuySol?: number;
}) {
  const mint = Keypair.generate();
  const payload = {
    publicKey: params.payer.publicKey.toBase58(),
    action: "create",
    tokenMetadata: {
      name: params.name,
      symbol: params.symbol,
      uri: params.uri,
    },
    mint: mint.publicKey.toBase58(),
    denominatedInSol: "true",
    amount: Math.max(0, params.devBuySol ?? 0),
    slippage: 15,
    priorityFee: 0.00005,
    pool: "pump",
  };
  const tradeRes = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!tradeRes.ok) {
    throw new Error(`pumpportal create failed: ${tradeRes.status} ${await tradeRes.text()}`);
  }
  const tx = VersionedTransaction.deserialize(new Uint8Array(await tradeRes.arrayBuffer()));
  tx.sign([mint, params.payer]);
  const conn = connection();
  const signature = await conn.sendTransaction(tx, { skipPreflight: false, maxRetries: 3 });
  await conn.confirmTransaction(signature, "confirmed").catch(() => undefined);
  return {
    mint: mint.publicKey.toBase58(),
    signature,
    pumpFunUrl: `https://pump.fun/coin/${mint.publicKey.toBase58()}`,
  };
}

export async function lockNinetyTen(
  mintStr: string,
  creator: Keypair,
  houseAddress: string,
) {
  const mint = new PublicKey(mintStr);
  const house = new PublicKey(houseAddress);
  const ixs = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
    await PUMP_SDK.createFeeSharingConfig({
      creator: creator.publicKey,
      mint,
      pool: null,
    }),
    await PUMP_SDK.updateFeeShares({
      authority: creator.publicKey,
      mint,
      currentShareholders: [],
      newShareholders: [
        { address: creator.publicKey, shareBps: AGENT_SHARE_BPS },
        { address: house, shareBps: HOUSE_SHARE_BPS },
      ],
    }),
  ];
  const conn = connection();
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([creator]);
  const sig = await conn.sendTransaction(tx, { maxRetries: 3 });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}
