import Link from "next/link";
import { ArrowRight, CheckCircle2, Database } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function TenantBanner() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: members } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name)")
    .limit(1)
    .maybeSingle();

  const tenantId = members?.tenant_id as string | undefined;
  const tenantName =
    (members?.tenants as unknown as { name?: string } | null)?.name ?? "Sua empresa";

  if (!tenantId) {
    return (
      <div className="mb-6 rounded-xl border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[color:var(--color-warning)]">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Sua conta não tem empresa vinculada</span>
            </div>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              Crie sua empresa para começar a cadastrar a frota.
            </p>
          </div>
          <Link
            href="/cadastros/empresa"
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-warning)] px-3 py-2 text-xs font-medium text-black hover:opacity-90"
          >
            Criar empresa <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Contadores rápidos
  const [drivers, vehicles, pumps, fuelings, anomaliesOpen] = await Promise.all([
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("pumps").select("*", { count: "exact", head: true }),
    supabase.from("fuelings").select("*", { count: "exact", head: true }),
    supabase
      .from("anomalies")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null),
  ]);

  const stats = [
    { label: "Motoristas", count: drivers.count ?? 0 },
    { label: "Veículos", count: vehicles.count ?? 0 },
    { label: "Bombas", count: pumps.count ?? 0 },
    { label: "Abastecimentos", count: fuelings.count ?? 0 },
    { label: "Anomalias abertas", count: anomaliesOpen.count ?? 0 },
  ];

  const empty = stats.slice(0, 4).every((s) => s.count === 0);

  return (
    <div className="mb-6 rounded-xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] p-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[color:var(--color-brand)]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium text-[color:var(--color-text-strong)]">
              Conectado · {tenantName}
            </span>
          </div>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            {empty
              ? "Sua empresa está pronta. Os números abaixo são exemplos de demonstração — cadastre frota para vê-los reais."
              : "Os números do painel já refletem seus dados cadastrados."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-xs text-[color:var(--color-muted)]"
            >
              <span className="font-mono text-[color:var(--color-text-strong)]">{s.count}</span> {s.label}
            </span>
          ))}
          <Link
            href="/cadastros"
            className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-brand)] hover:bg-[color:var(--color-brand)]/20"
          >
            Cadastros <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
