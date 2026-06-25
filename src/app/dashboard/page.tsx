import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  Fuel,
  PiggyBank,
  ShieldCheck,
  Truck,
  Trophy,
  Video,
  Zap,
} from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { TenantBanner } from "@/components/tenant-banner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAnalytics } from "@/lib/analytics";
import { LitrosArea, EventosBar, StatusPie, TopDriversBar, PieLegend } from "@/components/charts";
import { formatBRL, formatNumber, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EventRow = {
  when: string;
  pump: string;
  placa: string;
  motorista: string;
  litros: number;
  status: string;
  tone: "success" | "danger" | "warning" | "info" | "outline";
};

type RankingRow = {
  nome: string;
  kml: number;
  viagens: number;
  anomalias: number;
};

async function loadDashboardData(): Promise<{
  events: EventRow[];
  ranking: RankingRow[];
  litrosMes: number;
  bloqueiosMes: number;
  pumpsOnline: { online: number; total: number };
  latestAnomaly: { id: string; type: string; description: string | null; local: string } | null;
}> {
  const supabase = await createSupabaseServerClient();

  // Eventos recentes
  const { data: fuelings } = await supabase
    .from("fuelings")
    .select(
      "id, started_at, status, delivered_l, quota_l, alpr_plate, vehicles(plate), drivers(name), pumps(serial_number, yards(name), partner_station)"
    )
    .order("started_at", { ascending: false })
    .limit(6);

  const events: EventRow[] = ((fuelings ?? []) as unknown as Array<{
    id: string;
    started_at: string;
    status: string;
    delivered_l: number | null;
    quota_l: number;
    alpr_plate: string | null;
    vehicles: { plate: string } | null;
    drivers: { name: string } | null;
    pumps: { serial_number: string; yards: { name: string } | null; partner_station: string | null } | null;
  }>).map((f) => {
    const pumpLabel =
      f.pumps?.yards?.name ?? f.pumps?.partner_station ?? f.pumps?.serial_number ?? "—";
    const isBlocked = f.status === "BLOCKED";
    return {
      when: timeAgo(f.started_at),
      pump: pumpLabel,
      placa: f.alpr_plate ?? f.vehicles?.plate ?? "—",
      motorista: f.drivers?.name ?? "—",
      litros: Number(f.delivered_l ?? 0),
      status: isBlocked ? "Bloqueado" : "Conforme",
      tone: isBlocked ? "danger" : "success",
    };
  });

  // Mês corrente — litros e bloqueios
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthFuelings } = await supabase
    .from("fuelings")
    .select("status, delivered_l, driver_id, vehicle_id, drivers(name)")
    .gte("started_at", monthStart.toISOString());

  const monthRows = (monthFuelings ?? []) as unknown as Array<{
    status: string;
    delivered_l: number | null;
    driver_id: string;
    vehicle_id: string;
    drivers: { name: string } | null;
  }>;
  const litrosMes = monthRows.reduce((acc, r) => acc + Number(r.delivered_l ?? 0), 0);
  const bloqueiosMes = monthRows.filter((r) => r.status === "BLOCKED").length;

  // Anomalias por motorista (mês)
  const { data: anomaliaRows } = await supabase
    .from("anomalies")
    .select("fueling_id, fuelings(driver_id)")
    .gte("detected_at", monthStart.toISOString());

  const anomaliasMap = new Map<string, number>();
  for (const a of (anomaliaRows ?? []) as unknown as Array<{ fuelings: { driver_id: string } | null }>) {
    const did = a.fuelings?.driver_id;
    if (did) anomaliasMap.set(did, (anomaliasMap.get(did) ?? 0) + 1);
  }

  // Ranking de motoristas
  const driverMap = new Map<string, { nome: string; litros: number; viagens: number; anomalias: number }>();
  for (const r of monthRows) {
    if (!r.driver_id) continue;
    const prev = driverMap.get(r.driver_id) ?? {
      nome: r.drivers?.name ?? "—",
      litros: 0,
      viagens: 0,
      anomalias: anomaliasMap.get(r.driver_id) ?? 0,
    };
    if (r.status !== "BLOCKED") {
      prev.litros += Number(r.delivered_l ?? 0);
      prev.viagens += 1;
    }
    driverMap.set(r.driver_id, prev);
  }
  const ranking: RankingRow[] = Array.from(driverMap.values())
    .map((d) => ({
      nome: d.nome,
      kml: d.litros > 0 ? Number((d.viagens * 100 / d.litros).toFixed(2)) : 0,
      viagens: d.viagens,
      anomalias: d.anomalias,
    }))
    .sort((a, b) => b.viagens - a.viagens)
    .slice(0, 5);

  // Bombas online
  const { count: pumpsTotal } = await supabase.from("pumps").select("*", { count: "exact", head: true });
  const { count: pumpsOnline } = await supabase
    .from("pumps")
    .select("*", { count: "exact", head: true })
    .eq("status", "ONLINE");

  // Última anomalia aberta
  const { data: lastAnomalyData } = await supabase
    .from("anomalies")
    .select("id, type, description, detected_at, pumps(serial_number, yards(name), partner_station)")
    .is("resolved_at", null)
    .order("detected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const la = lastAnomalyData as unknown as {
    id: string;
    type: string;
    description: string | null;
    detected_at: string;
    pumps: { serial_number: string; yards: { name: string } | null; partner_station: string | null } | null;
  } | null;

  const latestAnomaly = la
    ? {
        id: la.id,
        type: la.type,
        description: la.description,
        local: la.pumps?.yards?.name ?? la.pumps?.partner_station ?? la.pumps?.serial_number ?? "—",
      }
    : null;

  // Fallback de DEMONSTRAÇÃO quando o tenant ainda não tem eventos
  if (events.length === 0) {
    return demoDashboard();
  }

  return {
    events,
    ranking,
    litrosMes,
    bloqueiosMes,
    pumpsOnline: { online: pumpsOnline ?? 0, total: pumpsTotal ?? 0 },
    latestAnomaly,
  };
}

// Dados fictícios genéricos para a apresentação (tenant vazio).
function demoDashboard() {
  const events: EventRow[] = [
    { when: "há 8 min", pump: "Pátio TransCargo · Bomba 02", placa: "RDA-1A01", motorista: "João Pereira", litros: 178.4, status: "Conforme", tone: "success" },
    { when: "há 26 min", pump: "Posto Estrela · BR-381", placa: "RDB-2B02", motorista: "Carlos Santos", litros: 240.0, status: "Conforme", tone: "success" },
    { when: "há 41 min", pump: "Pátio TransCargo · Bomba 01", placa: "RDC-3C03", motorista: "Marcos Oliveira", litros: 12.0, status: "Bloqueado", tone: "danger" },
    { when: "há 1 h", pump: "Posto Horizonte", placa: "RDD-4D04", motorista: "Paulo Ribeiro", litros: 95.6, status: "Conforme", tone: "success" },
    { when: "há 2 h", pump: "Pátio TransCargo · Bomba 03", placa: "RDE-5E05", motorista: "Antônio Costa", litros: 0.0, status: "Bloqueado", tone: "danger" },
    { when: "há 3 h", pump: "Posto Boa Viagem", placa: "RDF-6F06", motorista: "Rafael Lima", litros: 160.0, status: "Conforme", tone: "success" },
  ];
  const ranking: RankingRow[] = [
    { nome: "João Pereira", kml: 3.12, viagens: 24, anomalias: 0 },
    { nome: "Carlos Santos", kml: 3.04, viagens: 27, anomalias: 0 },
    { nome: "Marcos Oliveira", kml: 2.97, viagens: 19, anomalias: 0 },
    { nome: "Paulo Ribeiro", kml: 2.42, viagens: 22, anomalias: 1 },
    { nome: "Antônio Costa", kml: 2.11, viagens: 18, anomalias: 3 },
  ];
  return {
    events,
    ranking,
    litrosMes: 48230,
    bloqueiosMes: 14,
    pumpsOnline: { online: 12, total: 14 },
    latestAnomaly: {
      id: "demo0001",
      type: "CONTAINER_PATTERN",
      description: "IA detectou recipiente fora do padrão (balde) no bico. Corte imediato.",
      local: "Pátio TransCargo · Bomba 01",
    },
  };
}

const ANOMALY_LABEL: Record<string, string> = {
  CONTAINER_PATTERN: "Recipiente fora do padrão",
  PLATE_MISMATCH: "Placa divergente",
  QUOTA_EXCEEDED: "Volume acima da cota",
  OFFHOURS: "Fora do horário",
  TANK_DRAIN: "Drenagem de tanque",
  COMM_LOSS: "Perda de comunicação",
};

export default async function DashboardPage() {
  const { events: recentEvents, ranking, litrosMes, bloqueiosMes, pumpsOnline, latestAnomaly } =
    await loadDashboardData();
  const analytics = await loadAnalytics(14);
  const economiaEstimada = Math.round(bloqueiosMes * 230 * 100) / 100; // ~R$230 por bloqueio prevenido (estimativa)

  return (
    <SectionShell
      badge="Portal do Gestor"
      title="Visão central da operação"
      description="Faturamento, conciliação, ranking e alertas de anomalia em tempo real — tudo em um único painel."
    >
      {/* Status da empresa + contadores reais do banco */}
      <TenantBanner />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="Litros abastecidos · mês"
          value={`${formatNumber(Math.round(litrosMes))} L`}
          delta={recentEvents.length > 0 ? "Dados reais" : "Sem dados"}
          deltaUp
          icon={<Fuel className="h-4 w-4" />}
          sublabel="soma de delivered_l no mês"
        />
        <Kpi
          title="Economia estimada"
          value={formatBRL(economiaEstimada)}
          delta={`${bloqueiosMes} bloqueios`}
          deltaUp
          icon={<PiggyBank className="h-4 w-4" />}
          sublabel="cada bloqueio ≈ R$ 230 evitados"
        />
        <Kpi
          title="Bloqueios da IA"
          value={String(bloqueiosMes)}
          delta="este mês"
          deltaUp={false}
          icon={<ShieldCheck className="h-4 w-4" />}
          sublabel="ações da IA prevenindo desvios"
        />
        <Kpi
          title="Bombas IoT online"
          value={`${pumpsOnline.online} / ${pumpsOnline.total}`}
          delta={pumpsOnline.total > 0 ? `${Math.round((pumpsOnline.online / pumpsOnline.total) * 100)}%` : "—"}
          deltaUp
          icon={<Cpu className="h-4 w-4" />}
          sublabel="status reportado pelas bombas"
        />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">Litros abastecidos · 14 dias</h2>
              <p className="text-xs text-[color:var(--color-muted)]">
                Volume entregue por dia (apenas eventos conformes).
              </p>
            </div>
            <Link href="/relatorios" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              Relatório PDF →
            </Link>
          </div>
          <div className="px-3 py-4">
            <LitrosArea data={analytics.daily} />
          </div>
        </Card>

        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Distribuição</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Eventos por status (14 dias).</p>
          </div>
          <div className="px-3 py-4">
            <StatusPie data={analytics.statusDist} />
            <PieLegend data={analytics.statusDist} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Eventos × Bloqueios · 14 dias</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Volume de abastecimentos e quantos a IA bloqueou.
            </p>
          </div>
          <div className="px-3 py-4">
            <EventosBar data={analytics.daily} />
          </div>
        </Card>

        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Top motoristas</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Litros no período.</p>
          </div>
          <div className="px-3 py-4">
            <TopDriversBar data={analytics.topDrivers} />
          </div>
        </Card>
      </div>

      {/* Live + Anomalias */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--color-border)]">
            <div>
              <h2 className="text-base font-semibold text-white">Eventos recentes</h2>
              <p className="text-xs text-[color:var(--color-muted)]">
                Cada abastecimento é auditado pela IA antes de energizar a bomba.
              </p>
            </div>
            <Badge variant="info">
              <Activity className="h-3 w-3" />
              Tempo real
            </Badge>
          </div>
          <div className="divide-y divide-[color:var(--color-border)]">
            {recentEvents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[color:var(--color-muted)]">
                  Nenhum evento registrado ainda.
                </p>
                <Link
                  href="/simular"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-1.5 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white"
                >
                  <Zap className="h-3 w-3" />
                  Simular abastecimento
                </Link>
              </div>
            ) : (
              recentEvents.map((e, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 px-4 py-3 text-sm sm:grid sm:grid-cols-12 sm:items-center sm:gap-3 sm:px-5"
                >
                  <div className="flex items-center justify-between sm:col-span-3 sm:block">
                    <span className="text-xs text-[color:var(--color-muted)] sm:text-sm">
                      {e.when}
                    </span>
                    <span className="font-mono text-right text-sm text-white sm:hidden">
                      {e.litros.toFixed(1)} L
                    </span>
                  </div>
                  <div className="sm:col-span-4">
                    <div className="font-medium text-white">{e.pump}</div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      <span className="font-mono">{e.placa}</span> · {e.motorista}
                    </div>
                  </div>
                  <div className="hidden sm:col-span-2 sm:block sm:text-right sm:font-mono sm:text-white">
                    {e.litros.toFixed(1)} L
                  </div>
                  <div className="flex sm:col-span-3 sm:justify-end">
                    <Badge variant={e.tone}>
                      {e.tone === "danger" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[color:var(--color-border)] px-5 py-3 text-right">
            <Link href="/anomalias" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              Ver todas as anomalias →
            </Link>
          </div>
        </Card>

        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Anomalia mais recente</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              {latestAnomaly
                ? `${ANOMALY_LABEL[latestAnomaly.type] ?? latestAnomaly.type} · ${latestAnomaly.local}`
                : "Nenhuma anomalia aberta no momento."}
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="relative aspect-video overflow-hidden rounded-md border border-[color:var(--color-border)] bg-black">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-25">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-white/10" />
                ))}
              </div>
              <Video className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/30" />
              {latestAnomaly ? (
                <>
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-danger)]" />
                    ABERTA
                  </div>
                  <div className="absolute inset-x-2 bottom-2 rounded-md border border-[color:var(--color-danger)] bg-black/70 px-2 py-1 text-[10px] text-[color:var(--color-danger)]">
                    {latestAnomaly.description ?? "IA cortou a energia da bomba"}
                  </div>
                </>
              ) : (
                <div className="absolute inset-x-2 bottom-2 rounded-md border border-[color:var(--color-brand)]/40 bg-black/70 px-2 py-1 text-[10px] text-[color:var(--color-brand)]">
                  Operação sem anomalias abertas
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/anomalias">
                <Button size="sm" variant="outline">
                  {latestAnomaly ? "Abrir caso" : "Ver anomalias"}
                </Button>
              </Link>
              <Link href="/relatorios">
                <Button size="sm" variant="ghost">
                  Gerar relatório
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Conciliação + Ranking */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Conciliação SEFAZ · Tanques</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              XMLs de compra cruzados com saída efetiva (mês corrente).
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <ConcilRow label="Diesel S10 — Tanque 1" entrada={28000} saida={27640} />
            <ConcilRow label="Diesel S500 — Tanque 2" entrada={15000} saida={14910} />
            <ConcilRow label="Arla 32 — Tanque 3" entrada={4000} saida={3994} />
            <div className="pt-2 text-right">
              <Link href="/conciliacao" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
                Ver conciliação completa →
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Ranking de motoristas</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Eficiência (km/L) e anomalias detectadas pela IA.
            </p>
          </div>
          <div className="divide-y divide-[color:var(--color-border)]">
            {ranking.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[color:var(--color-muted)]">
                  Ranking aparece após o primeiro abastecimento.
                </p>
                <Link
                  href="/simular"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-brand)] hover:underline"
                >
                  Simular agora →
                </Link>
              </div>
            ) : (
              ranking.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                <div className="flex w-6 flex-none items-center justify-center">
                  {i === 0 ? (
                    <Trophy className="h-4 w-4 text-[color:var(--color-warning)]" />
                  ) : (
                    <span className="text-xs text-[color:var(--color-muted)]">#{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{m.nome}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {m.viagens} viagens · {m.anomalias} anomalia{m.anomalias === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2 sm:gap-3">
                  <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--color-surface-2)] sm:block sm:w-32">
                    <div
                      className="h-full bg-[color:var(--color-brand)]"
                      style={{ width: `${(m.kml / 3.5) * 100}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap font-mono text-white">
                    {m.kml.toFixed(2)} km/L
                  </span>
                </div>
              </div>
              ))
            )}
          </div>
          <div className="border-t border-[color:var(--color-border)] px-5 py-3 text-right">
            <Link href="/ranking" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              Ver ranking completo →
            </Link>
          </div>
        </Card>
      </div>

      {/* Frota */}
      <div className="mt-6">
        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Frota monitorada</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Veículos com placa cadastrada, cota e status atual.
            </p>
          </div>
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { placa: "BRA-2E19", modelo: "Scania R450", motorista: "Reinaldo S.", status: "Em rota" },
              { placa: "BRA-7K22", modelo: "Volvo FH 540", motorista: "Antônio L.", status: "Em rota" },
              { placa: "BRA-5C04", modelo: "Mercedes Actros", motorista: "Júlio A.", status: "Pátio" },
              { placa: "RIO-1A88", modelo: "Iveco Stralis", motorista: "Edna P.", status: "Em manutenção" },
            ].map((v, i) => (
              <div key={i} className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{v.placa}</span>
                  <Truck className="h-4 w-4 text-[color:var(--color-muted)]" />
                </div>
                <div className="mt-1 text-xs text-[color:var(--color-muted)]">{v.modelo}</div>
                <div className="mt-2 text-xs text-white">{v.motorista}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--color-brand)]">
                  {v.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SectionShell>
  );
}

function Kpi({
  title,
  value,
  delta,
  deltaUp,
  icon,
  sublabel,
}: {
  title: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon: React.ReactNode;
  sublabel: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          {title}
        </div>
        <div className="text-[color:var(--color-muted)]">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span
          className={
            deltaUp
              ? "inline-flex items-center gap-1 text-[color:var(--color-brand)]"
              : "inline-flex items-center gap-1 text-[color:var(--color-warning)]"
          }
        >
          {deltaUp ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {delta}
        </span>
        <span className="text-[color:var(--color-muted)]">{sublabel}</span>
      </div>
    </Card>
  );
}

function ConcilRow({
  label,
  entrada,
  saida,
}: {
  label: string;
  entrada: number;
  saida: number;
}) {
  const diff = entrada - saida;
  const pct = (diff / entrada) * 100;
  const tone = pct > 1.5 ? "danger" : pct > 0.8 ? "warning" : "success";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white">{label}</span>
        <Badge variant={tone}>
          {pct.toFixed(2)}% perda
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-[color:var(--color-muted)] sm:grid-cols-3 sm:gap-3">
        <span>Entrada (XML): <span className="font-mono text-white">{formatNumber(entrada)} L</span></span>
        <span>Saída (IoT): <span className="font-mono text-white">{formatNumber(saida)} L</span></span>
        <span className="sm:text-right">
          Diferença: <span className="font-mono text-white">{formatNumber(diff)} L</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-full bg-[color:var(--color-brand)]"
          style={{ width: `${(saida / entrada) * 100}%` }}
        />
      </div>
    </div>
  );
}
