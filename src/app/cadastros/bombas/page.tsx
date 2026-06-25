import Link from "next/link";
import { Cpu } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Badge } from "@/components/ui/badge";
import { ListShell, EmptyState } from "@/components/cadastros/crud-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "outline" }> = {
  ONLINE: { label: "Online", tone: "success" },
  OFFLINE: { label: "Offline", tone: "outline" },
  MAINTENANCE: { label: "Manutenção", tone: "warning" },
  BLOCKED: { label: "Bloqueada", tone: "danger" },
};

export default async function BombasPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pumps")
    .select("id, serial_number, status, iot_device_id, partner_station, yards(name), tanks(name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    serial_number: string;
    status: string;
    iot_device_id: string | null;
    partner_station: string | null;
    yards: { name: string } | null;
    tanks: { name: string } | null;
  }>;

  return (
    <SectionShell
      badge="Cadastros · Bombas"
      title="Bombas"
      description="Bombas físicas — pátio interno ou posto parceiro. Cada uma representa um ponto que a IA pode liberar ou bloquear."
    >
      <ListShell newHref="/cadastros/bombas/novo" newLabel="Nova bomba">
        {error ? (
          <div className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhuma bomba cadastrada"
            description="Cadastre uma bomba interna (pátio) ou conveniada (posto parceiro)."
            ctaHref="/cadastros/bombas/novo"
            ctaLabel="Cadastrar bomba"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Serial</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Local</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tanque</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">IoT</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rows.map((p) => {
                  const st = STATUS[p.status] ?? { label: p.status, tone: "outline" as const };
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/cadastros/bombas/${p.id}`}
                          className="flex items-center gap-2 font-mono font-medium text-[color:var(--color-text-strong)] hover:text-[color:var(--color-brand)]"
                        >
                          <Cpu className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                          {p.serial_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">
                        {p.yards?.name ?? p.partner_station ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">{p.tanks?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-xs">
                        {p.iot_device_id ? (
                          <span className="font-mono text-[color:var(--color-text-strong)]">{p.iot_device_id}</span>
                        ) : (
                          <span className="text-[color:var(--color-muted)]">não conectado</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={st.tone}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ListShell>
    </SectionShell>
  );
}
