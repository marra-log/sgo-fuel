import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnomaliasClient, type AnomalyRow } from "./anomalias-client";

export const dynamic = "force-dynamic";

type RawAnomaly = {
  id: string;
  type: string;
  severity: string;
  description: string | null;
  detected_at: string;
  resolved_at: string | null;
  pumps: { serial_number: string; yards: { name: string } | null; partner_station: string | null } | null;
  fuelings: { drivers: { name: string } | null; vehicles: { plate: string } | null } | null;
};

export default async function AnomaliasPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("anomalies")
    .select(
      "id, type, severity, description, detected_at, resolved_at, pumps(serial_number, yards(name), partner_station), fuelings(drivers(name), vehicles(plate))"
    )
    .order("detected_at", { ascending: false })
    .limit(100);

  const rows: AnomalyRow[] = ((data ?? []) as unknown as RawAnomaly[]).map((c) => ({
    id: c.id,
    type: c.type,
    severity: c.severity,
    description: c.description,
    detected_at: c.detected_at,
    resolved_at: c.resolved_at,
    local: c.pumps?.yards?.name ?? c.pumps?.partner_station ?? c.pumps?.serial_number ?? "—",
    motorista: c.fuelings?.drivers?.name ?? "—",
    placa: c.fuelings?.vehicles?.plate ?? "—",
  }));

  return (
    <SectionShell
      badge="Anomalias"
      title="Alertas em vídeo & auditoria"
      description="Cada caso é registrado com placa, motorista, bomba e horário. Filtre, exporte CSV e resolva. Vídeo entra com o hardware (Fase B)."
    >
      {error ? (
        <Card className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</Card>
      ) : (
        <AnomaliasClient rows={rows} />
      )}
    </SectionShell>
  );
}
