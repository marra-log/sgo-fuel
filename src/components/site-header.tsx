import Link from "next/link";
import { Fuel } from "lucide-react";

const links = [
  { href: "/", label: "Visão Geral" },
  { href: "/dashboard", label: "Portal do Gestor" },
  { href: "/anomalias", label: "Anomalias" },
  { href: "/conciliacao", label: "Conciliação SEFAZ" },
  { href: "/ranking", label: "Ranking" },
  { href: "/totem", label: "Totem IoT" },
  { href: "/pos", label: "Smart POS" },
  { href: "/motorista", label: "App Motorista" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">SGO-Fuel</span>
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Aether IA · Abastecimento
            </span>
          </div>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-xs text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-[color:var(--color-muted)] sm:inline">DEMO</span>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
        </div>
      </div>
    </header>
  );
}
