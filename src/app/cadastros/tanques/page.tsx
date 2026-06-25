import Link from "next/link";
import { Fuel } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FUEL: Record<string, string> = {
  DIESEL_S10: "Diesel S10",
  DIESEL_S500: "Diesel S500",
  ARLA32: "Arla 32",
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
};

export default async function TanquesPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tanks")
    .select("id, name, fuel_type, capacity_l, yards(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    fuel_type: string;
    capacity_l: number;
    yards: { name: string } | null;
  }>;

  return (
    <SectionShell
      badge="Cadastros · Tanques"
      title="Tanques"
      description="Reservatórios físicos por pátio. A conciliação SEFAZ cruza entrada (XML) com saída (IoT) por tanque."
    >
      <ListShell newHref="/cadastros/tanques/novo" newLabel="Novo tanque">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum tanque cadastrado"
            description="Cadastre os tanques físicos do pátio para começar a conciliar fiscal × IoT."
            ctaHref="/cadastros/tanques/novo"
            ctaLabel="Cadastrar tanque"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tanque</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Pátio</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Combustível</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Capacidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/cadastros/tanques/${t.id}`}
                        className="flex items-center gap-2 font-medium text-[color:var(--color-text-strong)] hover:text-[color:var(--color-brand)]"
                      >
                        <Fuel className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.yards?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-[color:var(--color-muted)]">{FUEL[t.fuel_type] ?? t.fuel_type}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{t.capacity_l.toLocaleString("pt-BR")} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListShell>
    </SectionShell>
  );
}
