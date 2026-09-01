import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: [
    "@pump-fun/pump-sdk",
    "@solana/web3.js",
    "bs58",
  ],
};

export default nextConfig;
