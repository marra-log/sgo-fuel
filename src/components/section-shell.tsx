import { SiteHeader } from "./site-header";

export function SectionShell({
  title,
  description,
  children,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          {badge ? (
            <span className="mb-3 inline-block rounded-full border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-medium text-[color:var(--color-brand)]">
              {badge}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
