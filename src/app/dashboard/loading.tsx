/**
 * Esqueleto do Portal enquanto os dados carregam.
 * O Portal faz várias consultas agregadas; sem isto a tela ficava em branco.
 */
export default function LoadingDashboard() {
  return (
    <div className="min-h-screen">
      <div className="h-[57px] border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <div className="mb-8 space-y-3">
          <div className="h-6 w-40 animate-pulse rounded-full bg-[color:var(--color-surface-2)]" />
          <div className="h-8 w-72 animate-pulse rounded-md bg-[color:var(--color-surface-2)]" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[color:var(--color-surface-2)]" />
        </div>

        <div className="mb-6 h-20 animate-pulse rounded-xl bg-[color:var(--color-surface-2)]" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]" />
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--color-muted)]">Carregando dados da operação…</p>
      </main>
    </div>
  );
}
