export const AGENT_SHARE_BPS = 9000;
export const HOUSE_SHARE_BPS = 1000;
export const SPONSORED_LAUNCHES = 3;
export const SELF_FUNDED_SOL = 0.03;
export const KEY_PREFIX = "bck_";
export const DEFAULT_MODEL = "xai/grok-4.5";
export const SOLANA_RPC =
  process.env.SOLANA_RPC_URL?.trim() ||
  "https://solana-rpc.publicnode.com";
export const WSOL = "So11111111111111111111111111111111111111112";
export const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const SKILLS = [
  { id: "token-launch", name: "Token launch", hint: "pump.fun creates, 90/10 split" },
  { id: "defi-trading", name: "DeFi trading", hint: "Jupiter quotes and swaps" },
  { id: "portfolio", name: "Portfolio", hint: "SOL + SPL balances" },
  { id: "market-intel", name: "Market intel", hint: "Dexscreener + prices" },
  { id: "wallet-ops", name: "Wallet ops", hint: "Whitelist transfers" },
] as const;

export type SkillId = (typeof SKILLS)[number]["id"];
