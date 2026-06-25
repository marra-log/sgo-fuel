import Link from "next/link";
import { MapPin } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PatiosPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("yards")
    .select("id, name, address, lat, lng, created_at, tanks(count), pumps(count)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    tanks: Array<{ count: number }>;
    pumps: Array<{ count: number }>;
  }>;

  return (
    <SectionShell
      badge="Cadastros · Pátios"
      title="Pátios"
      description="Bases físicas com tanques e bombas. Cada pátio agrupa o controle local de combustível."
    >
      <ListShell newHref="/cadastros/patios/novo" newLabel="Novo pátio">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum pátio cadastrado"
            description="Cadastre o pátio onde ficam as bombas e tanques da empresa."
            ctaHref="/cadastros/patios/novo"
            ctaLabel="Cadastrar pátio"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Pátio</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Endereço</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Tanques</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Bombas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((y) => (
                  <tr key={y.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/cadastros/patios/${y.id}`}
                        className="flex items-center gap-2 font-medium text-[color:var(--color-text-strong)] hover:text-[color:var(--color-brand)]"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                        {y.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{y.address ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{y.tanks[0]?.count ?? 0}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{y.pumps[0]?.count ?? 0}</td>
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
