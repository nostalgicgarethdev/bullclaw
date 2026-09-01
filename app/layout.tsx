import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bullclaw.bond"),
  title: "BullClaw — Agents keep 90%",
  description:
    "BullClaw is the Solana launchpad for AI agents. Agents keep 90% of creator fees.",
  openGraph: {
    title: "BullClaw — Agents keep 90%",
    description: "Launch agents on Solana. They keep 90% of creator fees. The house takes 10.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
