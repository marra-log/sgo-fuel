"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Fuel, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const links = [
  { href: "/", label: "Visão Geral" },
  { href: "/dashboard", label: "Portal do Gestor" },
  { href: "/frota", label: "Cartão Frota" },
  { href: "/postos", label: "Rede de Postos" },
  { href: "/cadastros", label: "Cadastros" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/maquininha", label: "Maquininha" },
  { href: "/faturamento", label: "Faturamento" },
  { href: "/simular", label: "Simular" },
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/anomalias", label: "Anomalias" },
  { href: "/conciliacao", label: "Conciliação SEFAZ" },
  { href: "/ranking", label: "Ranking" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/auditoria", label: "Auditoria" },
  { href: "/app", label: "App Motorista (PWA)" },
  { href: "/totem", label: "Totem IoT" },
  { href: "/pos", label: "Smart POS" },
  { href: "/motorista", label: "Vitrine" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fecha o drawer ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer está aberto
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

        {/* Desktop nav */}
        <nav className="hidden gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-[color:var(--color-surface-2)] text-white"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-white"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: user menu + hamburger */}
        <div className="flex items-center gap-2">
          <UserMenu />

          {/* Hamburger só aparece abaixo do breakpoint lg */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-white transition-colors hover:bg-[color:var(--color-surface-2)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Painel */}
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
                  <Fuel className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">SGO-Fuel</div>
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Aether IA
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-white transition-colors hover:bg-[color:var(--color-surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="mb-3 px-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Navegação
              </div>
              <ul className="space-y-1">
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors",
                          active
                            ? "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                            : "text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]"
                        )}
                      >
                        <span>{l.label}</span>
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand)]" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-[color:var(--color-border)] px-4 py-3 text-[11px] text-[color:var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Demonstração interativa</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
