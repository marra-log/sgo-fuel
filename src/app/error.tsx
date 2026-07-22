"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Activity, Fuel, RotateCcw } from "lucide-react";

/**
 * Fronteira de erro das telas internas. Em vez do erro cru do Next, mostra uma
 * tela com marca, ação de recuperação e caminho para o diagnóstico.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SGO-Fuel] erro na tela:", error);
  }, [error]);

  const ehRls = /row-level security|permission denied|violates row-level/i.test(error?.message ?? "");

  return (
    <div className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand)] text-black">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-[color:var(--color-text-strong)]">SGO-Fuel</div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Aether IA · Abastecimento
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-surface)] p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[color:var(--color-danger)]" />
          <h1 className="mt-4 text-xl font-semibold text-[color:var(--color-text-strong)]">
            Algo deu errado nesta tela
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            {ehRls
              ? "O banco recusou a operação por permissão (RLS). Normalmente é a conta sem empresa vinculada ou uma policy faltando."
              : "A operação não pôde ser concluída. Seus dados não foram alterados."}
          </p>

          {error?.message ? (
            <pre className="mt-4 overflow-x-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-left text-[11px] text-[color:var(--color-muted)]">
              {error.message}
              {error.digest ? `\n(ref: ${error.digest})` : ""}
            </pre>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" /> Tentar novamente
            </button>
            <Link
              href="/diagnostico"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface)]"
            >
              <Activity className="h-4 w-4" /> Abrir diagnóstico
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]"
            >
              Voltar ao Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
