"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Abas de seção: telas que respondem à MESMA pergunta ficam agrupadas,
 * em vez de virarem itens soltos de menu (evita "onde eu clico?").
 */
export const FINANCEIRO_TABS = [
  { href: "/transacoes", label: "Abastecimentos" },
  { href: "/faturamento", label: "Faturamento" },
  { href: "/conciliacao", label: "Conciliação fiscal" },
  { href: "/relatorios", label: "Relatórios" },
];

export function SectionTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-1 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[color:var(--color-brand)] text-black"
                : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text-strong)]"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
