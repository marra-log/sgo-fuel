import Link from "next/link";
import { SiteHeader } from "./site-header";

type Crumb = { href: string; label: string };

/**
 * Casca padrão das telas internas.
 * `width="form"` deixa a coluna estreita (max-w-3xl) — telas de formulário
 * não devem esticar até 1280px, o que criava muito espaço morto à direita.
 */
export function SectionShell({
  title,
  description,
  children,
  badge,
  crumbs,
  width = "wide",
}: {
  title: string;
  description?: string;
  badge?: string;
  crumbs?: Crumb[];
  width?: "wide" | "form";
  children: React.ReactNode;
}) {
  const max = width === "form" ? "max-w-3xl" : "max-w-7xl";
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className={`mx-auto ${max} px-4 py-6 sm:py-10`}>
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Trilha" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-[color:var(--color-muted)]">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 ? <span aria-hidden>/</span> : null}
                <Link href={c.href} className="hover:text-[color:var(--color-text-strong)] hover:underline">
                  {c.label}
                </Link>
              </span>
            ))}
            <span aria-hidden>/</span>
            <span className="text-[color:var(--color-text)]">{title}</span>
          </nav>
        ) : null}

        <div className="mb-6 sm:mb-8">
          {badge ? (
            <span className="mb-3 inline-block rounded-full border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-medium text-[color:var(--color-brand)]">
              {badge}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold leading-tight text-[color:var(--color-text-strong)] sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
