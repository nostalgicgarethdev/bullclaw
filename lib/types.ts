export type SkillId =
  | "token-launch"
  | "defi-trading"
  | "portfolio"
  | "market-intel"
  | "wallet-ops";

export type User = {
  id: string;
  handle: string;
  createdAt: number;
  keyHash: string;
  keyPrefix: string;
  sponsoredLaunchesUsed: number;
};

export type WhitelistEntry = {
  address: string;
  label?: string;
  addedAt: number;
};

export type AgentToken = {
  mint: string;
  name: string;
  symbol: string;
  signature: string;
  imageUrl?: string;
  pumpFunUrl: string;
  launchedAt: number;
};

export type Agent = {
  id: string;
  userId: string;
  name: string;
  persona: string;
  model: string;
  skills: SkillId[];
  wallet: string;
  secretEnc: string;
  status: "running" | "stopped";
  whitelist: WhitelistEntry[];
  token?: AgentToken;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  agentId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  at: number;
  tools?: { name: string; input: unknown; output: unknown }[];
};

export type Distribution = {
  at: number;
  lamports: string;
  signature?: string;
  note: string;
};

export type Earnings = {
  agentId: string;
  totalEarnedLamports: string;
  totalSentLamports: string;
  totalPendingLamports: string;
  distributions: Distribution[];
};

export type LaunchedToken = {
  mint: string;
  name: string;
  symbol: string;
  agentId: string;
  agentName: string;
  signature: string;
  imageUrl?: string;
  pumpFunUrl: string;
  createdAt: number;
};

export type Store = {
  users: Record<string, User>;
  agents: Record<string, Agent>;
  keys: Record<string, string>;
  messages: Record<string, ChatMessage[]>;
  tokens: LaunchedToken[];
  earnings: Record<string, Earnings>;
  updatedAt: number;
};
