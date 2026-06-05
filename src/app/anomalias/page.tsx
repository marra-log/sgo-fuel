import Link from "next/link";
import { AlertTriangle, Camera, Eye, Filter, Video, Zap } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import { ResolveButton } from "./resolve-button";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  CONTAINER_PATTERN: "Recipiente fora do padrão",
  PLATE_MISMATCH: "Placa divergente",
  QUOTA_EXCEEDED: "Volume acima da cota",
  OFFHOURS: "Fora do horário",
  TANK_DRAIN: "Drenagem de tanque",
  COMM_LOSS: "Perda de comunicação",
};

const SEV_TONE: Record<string, "danger" | "warning" | "info" | "outline"> = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

type AnomalyRow = {
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
    .limit(50);

  const rows = (data ?? []) as unknown as AnomalyRow[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const critToday = rows.filter(
    (r) => r.severity === "CRITICAL" && new Date(r.detected_at) >= today
  ).length;
  const otherToday = rows.filter(
    (r) => r.severity !== "CRITICAL" && new Date(r.detected_at) >= today
  ).length;
  const totalMonth = rows.length;

  return (
    <SectionShell
      badge="Anomalias"
      title="Alertas em vídeo & auditoria"
      description="Cada caso é registrado com placa, motorista, bomba e horário. Quando o hardware estiver instalado, vídeos e fotos entram automaticamente."
    >
      {error ? (
        <Card className="p-6 text-sm text-[color:var(--color-danger)]">{error.message}</Card>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          {critToday > 0 ? (
            <Badge variant="danger">
              <AlertTriangle className="h-3 w-3" />
              {critToday} {critToday === 1 ? "crítica hoje" : "críticas hoje"}
            </Badge>
          ) : null}
          {otherToday > 0 ? (
            <Badge variant="warning">{otherToday} médias / altas hoje</Badge>
          ) : null}
        </div>
        <span className="text-xs text-[color:var(--color-muted)]">
          Mostrando últimas: <span className="text-white">{totalMonth}</span>
        </span>
      </div>

      {rows.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] p-3 text-[color:var(--color-brand)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">Sem anomalias registradas</h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Quando a IA bloquear uma tentativa, ela aparece aqui automaticamente.
          </p>
          <Link
            href="/simular"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white"
          >
            <Zap className="h-3 w-3" />
            Simular um bloqueio
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((c) => {
            const tone = SEV_TONE[c.severity] ?? "outline";
            const local =
              c.pumps?.yards?.name ?? c.pumps?.partner_station ?? c.pumps?.serial_number ?? "—";
            const motorista = c.fuelings?.drivers?.name ?? "—";
            const placa = c.fuelings?.vehicles?.plate ?? "—";
            const resolved = Boolean(c.resolved_at);
            return (
              <Card key={c.id} className="grid gap-0 md:grid-cols-[280px_1fr]">
                <div className="relative aspect-video md:aspect-auto border-b border-[color:var(--color-border)] bg-black md:border-b-0 md:border-r">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-25">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-r border-b border-white/10" />
                    ))}
                  </div>
                  <Video className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/30" />
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white">
                    <Camera className="h-3 w-3 text-[color:var(--color-brand)]" />
                    ALPR
                  </div>
                  <div className="absolute left-2 bottom-2 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
                    {placa}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[color:var(--color-muted)]">
                        ANM-{c.id.slice(0, 4).toUpperCase()}
                      </span>
                      <Badge variant={tone}>{c.severity}</Badge>
                      {resolved ? <Badge variant="success">Resolvida</Badge> : null}
                    </div>
                    <span className="text-xs text-[color:var(--color-muted)]">
                      {timeAgo(c.detected_at)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {TIPO_LABEL[c.type] ?? c.type}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    {c.description ?? "Sem descrição."}
                  </p>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <Field label="Local" value={local} />
                    <Field label="Placa" value={placa} mono />
                    <Field label="Motorista" value={motorista} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled>
                      <Eye className="h-3.5 w-3.5" />
                      Vídeo completo (B1)
                    </Button>
                    {!resolved ? <ResolveButton id={c.id} /> : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={`mt-0.5 text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
