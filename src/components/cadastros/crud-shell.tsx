import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ListShell({
  backHref = "/cadastros",
  backLabel = "Voltar para cadastros",
  newHref,
  newLabel = "Novo",
  children,
}: {
  backHref?: string;
  backLabel?: string;
  newHref?: string;
  newLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" /> {backLabel}
        </Link>
        {newHref ? (
          <Link
            href={newHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white"
          >
            <Plus className="h-3 w-3" />
            {newLabel}
          </Link>
        ) : null}
      </div>
      <Card className="overflow-hidden">{children}</Card>
    </>
  );
}

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[color:var(--color-surface-2)] p-3 text-[color:var(--color-muted)]">
        <ArrowRight className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">{description}</p>
      ) : null}
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white"
        >
          <Plus className="h-3 w-3" />
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function FormShell({
  backHref,
  title,
  subtitle,
  children,
}: {
  backHref: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
      </div>
      <Card className="max-w-2xl p-6">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </Card>
    </>
  );
}
