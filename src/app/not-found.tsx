import Link from "next/link";
import { ArrowRight, Compass, Fuel } from "lucide-react";

export const metadata = { title: "SGO-Fuel · Página não encontrada" };

const ATALHOS = [
  { href: "/dashboard", label: "Portal do Gestor" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/transacoes", label: "Abastecimentos" },
  { href: "/cadastros", label: "Cadastros" },
];

export default function NotFound() {
  return (
    <div className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-base font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Aether IA · Abastecimento
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8">
          <Compass className="mx-auto h-8 w-8 text-[color:var(--color-muted)]" />
          <h1 className="mt-4 text-2xl font-semibold text-[color:var(--color-text-strong)]">
            Página não encontrada
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            O endereço que você abriu não existe ou foi movido. Nada foi perdido — use um dos atalhos abaixo.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {ATALHOS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-[color:var(--color-text-strong)] transition-colors hover:border-[color:var(--color-brand)]/60"
              >
                {a.label}
                <ArrowRight className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-[color:var(--color-muted)]">
          <Link href="/dashboard" className="hover:underline">
            ← Voltar ao Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
