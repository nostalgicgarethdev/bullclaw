import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/tokens", label: "Board" },
  { href: "/docs", label: "Docs" },
  { href: "/dashboard", label: "Desk" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="grain pointer-events-none fixed inset-0 opacity-40 mix-blend-overlay" />
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(11,9,7,0.86)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-md object-cover" />
            <span className="display text-lg font-extrabold tracking-tight">BullClaw</span>
          </Link>
          <nav className="hidden items-center gap-5 text-xs uppercase tracking-[0.18em] text-[var(--color-mute)] sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[var(--color-ivory)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-ember)] px-4 py-2 text-xs font-medium text-black"
          >
            Deploy agent
          </Link>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-[var(--color-line)] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-mute)] sm:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--color-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-xs text-[var(--color-mute)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>BullClaw · Solana agents · 90 / 10 split</p>
          <p>Not financial advice. Launches can go to zero.</p>
        </div>
      </footer>
    </div>
  );
}
