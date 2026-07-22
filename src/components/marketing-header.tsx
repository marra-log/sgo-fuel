import Link from "next/link";
import { Fuel } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

/**
 * Cabeçalho da página pública de apresentação.
 * A landing NÃO deve usar o SiteHeader (menu interno do sistema): um visitante
 * não logado veria a navegação operacional e não encontraria como entrar.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex flex-none items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</span>
            <span className="hidden text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] sm:block">
              Aether IA · Abastecimento
            </span>
          </div>
        </Link>

        <div className="flex flex-none items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-xs font-medium text-[color:var(--color-text-strong)] transition-colors hover:bg-[color:var(--color-surface-2)]"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-brand)] px-3 text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
