import Link from "next/link";
import { Truck } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Vehicle = {
  id: string;
  plate: string;
  model: string | null;
  fuel_type: string;
  tank_capacity_l: number | null;
  avg_consumption: number | null;
  current_odometer: number | null;
  drivers: { name: string } | null;
};

export default async function VeiculosPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, drivers(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Vehicle[];

  return (
    <SectionShell
      badge="Cadastros · Veículos"
      title="Veículos"
      description="Frota da empresa: placa, modelo, consumo médio (km/L) e motorista atual."
    >
      <ListShell newHref="/cadastros/veiculos/novo" newLabel="Novo veículo">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum veículo cadastrado"
            description="Cadastre os caminhões / utilitários da empresa para vinculá-los a motoristas."
            ctaHref="/cadastros/veiculos/novo"
            ctaLabel="Cadastrar veículo"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Modelo</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Combustível</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista atual</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Consumo</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">KM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/cadastros/veiculos/${v.id}`}
                        className="flex items-center gap-2 font-mono font-medium text-[color:var(--color-text-strong)] hover:text-[color:var(--color-brand)]"
                      >
                        <Truck className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                        {v.plate}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{v.model ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-[color:var(--color-muted)]">{fuelLabel(v.fuel_type)}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{v.drivers?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">
                      {v.avg_consumption ? `${v.avg_consumption} km/L` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">
                      {v.current_odometer?.toLocaleString("pt-BR") ?? "—"}
                    </td>
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

function fuelLabel(t: string) {
  return (
    {
      DIESEL_S10: "Diesel S10",
      DIESEL_S500: "Diesel S500",
      ARLA32: "Arla 32",
      GASOLINE: "Gasolina",
      ETHANOL: "Etanol",
    } as Record<string, string>
  )[t] ?? t;
}
