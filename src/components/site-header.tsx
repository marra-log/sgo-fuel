"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Fuel, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

// Links principais mostrados inline no desktop
const primary = [
  { href: "/dashboard", label: "Portal" },
  { href: "/frota", label: "Cartão Frota" },
  { href: "/postos", label: "Rede de Postos" },
  { href: "/cadastros", label: "Cadastros" },
  { href: "/maquininha", label: "Maquininha" },
  { href: "/relatorios", label: "Relatórios" },
];

// Menu completo agrupado (drawer)
const groups: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Visão Geral" },
      { href: "/dashboard", label: "Portal do Gestor" },
    ],
  },
  {
    title: "Cartão Frota",
    items: [
      { href: "/frota", label: "Plataforma (hub)" },
      { href: "/frota/cliente", label: "Painel do Cliente" },
      { href: "/frota/motorista", label: "Painel do Motorista" },
      { href: "/frota/posto", label: "Gestão do Posto" },
      { href: "/cartoes", label: "Cartões" },
      { href: "/maquininha", label: "Maquininha" },
      { href: "/faturamento", label: "Faturamento" },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/simular", label: "Simular" },
      { href: "/anomalias", label: "Anomalias" },
      { href: "/conciliacao", label: "Conciliação SEFAZ" },
      { href: "/ranking", label: "Ranking" },
      { href: "/relatorios", label: "Relatórios" },
      { href: "/auditoria", label: "Auditoria" },
      { href: "/diagnostico", label: "Diagnóstico" },
    ],
  },
  {
    title: "Cadastros & Equipe",
    items: [
      { href: "/cadastros", label: "Cadastros da frota" },
      { href: "/usuarios", label: "Usuários & acessos" },
    ],
  },
  {
    title: "Rede & Vitrine",
    items: [
      { href: "/postos", label: "Rede de Postos" },
      { href: "/app", label: "App Motorista (PWA)" },
      { href: "/totem", label: "Totem IoT" },
      { href: "/pos", label: "Smart POS" },
      { href: "/motorista", label: "Vitrine" },
    ],
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex flex-none items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</span>
            <span className="hidden text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] sm:block">
              Aether IA · Abastecimento
            </span>
          </div>
        </Link>

        {/* Desktop: principais */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {primary.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-strong)]"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-strong)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-none items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 text-xs text-[color:var(--color-text-strong)] transition-colors hover:bg-[color:var(--color-surface-2)]"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>

      {/* Drawer completo (mobile e desktop) */}
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
                  <Fuel className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</div>
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Menu</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {groups.map((g) => (
                <div key={g.title} className="mb-4">
                  <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                    {g.title}
                  </div>
                  <ul className="space-y-0.5">
                    {g.items.map((l) => {
                      const active = pathname === l.href;
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                              active
                                ? "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                                : "text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]"
                            )}
                          >
                            <span>{l.label}</span>
                            {active ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand)]" /> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
