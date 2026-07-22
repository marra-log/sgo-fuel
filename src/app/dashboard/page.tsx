import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  CreditCard,
  Fuel,
  PiggyBank,
  ShieldCheck,
  Truck,
  Trophy,
  Video,
  Wallet,
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
import { Kpi, WalletStat, ConcilRow } from "@/components/dashboard/stats";
import { OnboardingChecklist } from "@/components/dashboard/onboarding";

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
  litros: number;
  abastecimentos: number;
  anomalias: number;
};

type ConcilTank = { label: string; entrada: number; saida: number };

type FleetVehicle = { placa: string; modelo: string | null; motorista: string | null };

async function loadDashboardData(): Promise<{
  events: EventRow[];
  ranking: RankingRow[];
  litrosMes: number;
  bloqueiosMes: number;
  custoCompraMes: number;
  pumpsOnline: { online: number; total: number };
  latestAnomaly: { id: string; type: string; description: string | null; local: string } | null;
  concil: ConcilTank[];
  frota: FleetVehicle[];
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

  // Ranking de motoristas — apenas dados medidos: litros, nº de abastecimentos e anomalias.
  // km/L só entra quando houver odômetro real registrado no fechamento do abastecimento.
  const driverMap = new Map<string, RankingRow>();
  for (const r of monthRows) {
    if (!r.driver_id) continue;
    const prev = driverMap.get(r.driver_id) ?? {
      nome: r.drivers?.name ?? "—",
      litros: 0,
      abastecimentos: 0,
      anomalias: anomaliasMap.get(r.driver_id) ?? 0,
    };
    if (r.status !== "BLOCKED") {
      prev.litros += Number(r.delivered_l ?? 0);
      prev.abastecimentos += 1;
    }
    driverMap.set(r.driver_id, prev);
  }
  const ranking: RankingRow[] = Array.from(driverMap.values())
    .sort((a, b) => b.litros - a.litros)
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

  // Conciliação por tanque (mês corrente): entrada via NFe × saída via abastecimentos
  const [{ data: tanks }, { data: invoices }, { data: pumpTanks }, { data: monthPumpFuelings }] = await Promise.all([
    supabase.from("tanks").select("id, name, fuel_type"),
    supabase.from("fiscal_invoices").select("tank_id, volume_l, value_brl, issued_at"),
    supabase.from("pumps").select("id, tank_id"),
    supabase
      .from("fuelings")
      .select("pump_id, delivered_l, status")
      .gte("started_at", monthStart.toISOString()),
  ]);

  const custoCompraMes = ((invoices ?? []) as Array<{ value_brl: number | null; issued_at: string | null }>)
    .filter((inv) => inv.issued_at && new Date(inv.issued_at) >= monthStart)
    .reduce((a, inv) => a + Number(inv.value_brl ?? 0), 0);

  const pumpToTank = new Map<string, string>();
  for (const p of (pumpTanks ?? []) as Array<{ id: string; tank_id: string | null }>)
    if (p.tank_id) pumpToTank.set(p.id, p.tank_id);

  const saidaPorTanque = new Map<string, number>();
  for (const f of (monthPumpFuelings ?? []) as Array<{ pump_id: string; delivered_l: number | null; status: string }>) {
    if (f.status === "BLOCKED") continue;
    const tid = pumpToTank.get(f.pump_id);
    if (tid) saidaPorTanque.set(tid, (saidaPorTanque.get(tid) ?? 0) + Number(f.delivered_l ?? 0));
  }
  const entradaPorTanque = new Map<string, number>();
  for (const inv of (invoices ?? []) as Array<{ tank_id: string | null; volume_l: number | null }>) {
    if (inv.tank_id) entradaPorTanque.set(inv.tank_id, (entradaPorTanque.get(inv.tank_id) ?? 0) + Number(inv.volume_l ?? 0));
  }
  const concil: ConcilTank[] = ((tanks ?? []) as Array<{ id: string; name: string; fuel_type: string }>)
    .map((t) => ({
      label: t.name,
      entrada: Math.round(entradaPorTanque.get(t.id) ?? 0),
      saida: Math.round(saidaPorTanque.get(t.id) ?? 0),
    }))
    .filter((t) => t.entrada > 0 || t.saida > 0)
    .slice(0, 4);

  // Frota real cadastrada
  const { data: vehiclesData } = await supabase
    .from("vehicles")
    .select("plate, model, drivers:current_driver_id(name)")
    .order("created_at", { ascending: false })
    .limit(4);
  const frota: FleetVehicle[] = ((vehiclesData ?? []) as unknown as Array<{
    plate: string;
    model: string | null;
    drivers: { name: string } | null;
  }>).map((v) => ({ placa: v.plate, modelo: v.model, motorista: v.drivers?.name ?? null }));

  return {
    events,
    ranking,
    litrosMes,
    bloqueiosMes,
    custoCompraMes,
    pumpsOnline: { online: pumpsOnline ?? 0, total: pumpsTotal ?? 0 },
    latestAnomaly,
    concil,
    frota,
  };
}

// Carteira pré-paga da frota (best-effort: só aparece se wallet.sql foi aplicado)
async function loadWallet(): Promise<{ saldo: number; recargasMes: number; debitadoMes: number; cartoesAtivos: number } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: bal, error } = await supabase.from("fleet_cards").select("balance_brl, status");
  if (error || !bal) return null;

  const saldo = (bal as Array<{ balance_brl: number | null; status: string }>).reduce((a, c) => a + Number(c.balance_brl ?? 0), 0);
  const cartoesAtivos = (bal as Array<{ status: string }>).filter((c) => c.status === "ACTIVE").length;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: rec }, { data: tx }] = await Promise.all([
    supabase.from("card_recharges").select("amount_brl").gte("created_at", monthStart.toISOString()),
    supabase.from("card_transactions").select("amount_brl").eq("status", "APPROVED").gte("created_at", monthStart.toISOString()),
  ]);
  const recargasMes = (rec ?? []).reduce((a, c) => a + Number((c as { amount_brl: number }).amount_brl ?? 0), 0);
  const debitadoMes = (tx ?? []).reduce((a, c) => a + Number((c as { amount_brl: number }).amount_brl ?? 0), 0);

  return { saldo, recargasMes, debitadoMes, cartoesAtivos };
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
  const { events: recentEvents, ranking, litrosMes, bloqueiosMes, custoCompraMes, pumpsOnline, latestAnomaly, concil, frota } =
    await loadDashboardData();
  const analytics = await loadAnalytics(14);
  const wallet = await loadWallet();

  return (
    <SectionShell
      badge="Portal do Gestor"
      title="Visão central da operação"
      description="Faturamento, conciliação, ranking e alertas de anomalia em tempo real — tudo em um único painel."
    >
      {/* Status da empresa + contadores reais do banco */}
      <TenantBanner />

      {/* Primeiros passos — some quando a operação está configurada */}
      <OnboardingChecklist />

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
          title="Combustível comprado · mês"
          value={formatBRL(custoCompraMes)}
          delta="NFes importadas"
          deltaUp
          icon={<PiggyBank className="h-4 w-4" />}
          sublabel="soma das notas fiscais do mês"
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

      {/* Carteira da frota (cartão pré-pago) */}
      {wallet ? (
        <div className="mt-6">
          <Card>
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-[color:var(--color-text-strong)]">
                  <Wallet className="h-4 w-4 text-[color:var(--color-brand)]" /> Carteira da frota
                </h2>
                <p className="text-xs text-[color:var(--color-muted)]">Saldo pré-pago dos cartões e movimento do mês.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/cartoes/recarga" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">Recarregar →</Link>
                <Link href="/transacoes" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">Transações →</Link>
              </div>
            </div>
            <div className="grid gap-px bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
              <WalletStat title="Saldo em cartões" value={formatBRL(wallet.saldo)} icon={<Wallet className="h-3.5 w-3.5" />} brand />
              <WalletStat title="Recargas · mês" value={formatBRL(wallet.recargasMes)} icon={<ArrowUpRight className="h-3.5 w-3.5" />} />
              <WalletStat title="Debitado · mês" value={formatBRL(wallet.debitadoMes)} icon={<ArrowDownRight className="h-3.5 w-3.5" />} />
              <WalletStat title="Cartões ativos" value={String(wallet.cartoesAtivos)} icon={<CreditCard className="h-3.5 w-3.5" />} />
            </div>
          </Card>
        </div>
      ) : null}

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Litros abastecidos · 14 dias</h2>
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
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Distribuição</h2>
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
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Eventos × Bloqueios · 14 dias</h2>
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
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Top motoristas</h2>
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
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Eventos recentes</h2>
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
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-1.5 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-[color:var(--color-text-strong)]"
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
                    <span className="font-mono text-right text-sm text-[color:var(--color-text-strong)] sm:hidden">
                      {e.litros.toFixed(1)} L
                    </span>
                  </div>
                  <div className="sm:col-span-4">
                    <div className="font-medium text-[color:var(--color-text-strong)]">{e.pump}</div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      <span className="font-mono">{e.placa}</span> · {e.motorista}
                    </div>
                  </div>
                  <div className="hidden sm:col-span-2 sm:block sm:text-right sm:font-mono sm:text-[color:var(--color-text-strong)]">
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
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Anomalia mais recente</h2>
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
              <Video className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-[color:var(--color-text-strong)]/30" />
              {latestAnomaly ? (
                <>
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] text-[color:var(--color-text-strong)]">
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
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Conciliação SEFAZ · Tanques</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              XMLs de compra cruzados com saída efetiva (mês corrente).
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {concil.length === 0 ? (
              <p className="py-6 text-center text-sm text-[color:var(--color-muted)]">
                Sem movimento de tanque no mês. Importe o XML da NFe em{" "}
                <Link href="/conciliacao" className="text-[color:var(--color-brand)] hover:underline">Conciliação</Link>{" "}
                para cruzar entrada × saída.
              </p>
            ) : (
              concil.map((t) => <ConcilRow key={t.label} label={t.label} entrada={t.entrada} saida={t.saida} />)
            )}
            <div className="pt-2 text-right">
              <Link href="/conciliacao" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
                Ver conciliação completa →
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Ranking de motoristas</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Litros abastecidos e anomalias detectadas pela IA no mês.
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
                  <div className="truncate font-medium text-[color:var(--color-text-strong)]">{m.nome}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {m.abastecimentos} abastecimento{m.abastecimentos === 1 ? "" : "s"} · {m.anomalias} anomalia{m.anomalias === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2 sm:gap-3">
                  <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--color-surface-2)] sm:block sm:w-32">
                    <div
                      className="h-full bg-[color:var(--color-brand)]"
                      style={{ width: `${ranking[0]?.litros ? Math.min(100, (m.litros / ranking[0].litros) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap font-mono text-[color:var(--color-text-strong)]">
                    {formatNumber(Math.round(m.litros))} L
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
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Frota monitorada</h2>
              <p className="text-xs text-[color:var(--color-muted)]">
                Últimos veículos cadastrados e motorista vinculado.
              </p>
            </div>
            <Link href="/cadastros/veiculos" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              Ver todos →
            </Link>
          </div>
          {frota.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Truck className="mx-auto h-6 w-6 text-[color:var(--color-muted)]" />
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">Nenhum veículo cadastrado ainda.</p>
              <Link href="/cadastros/veiculos/novo" className="mt-2 inline-block text-xs font-medium text-[color:var(--color-brand)] hover:underline">
                Cadastrar veículo →
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {frota.map((v, i) => (
                <div key={i} className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-[color:var(--color-text-strong)]">{v.placa}</span>
                    <Truck className="h-4 w-4 text-[color:var(--color-muted)]" />
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--color-muted)]">{v.modelo ?? "—"}</div>
                  <div className="mt-2 text-xs text-[color:var(--color-text-strong)]">{v.motorista ?? "Sem motorista vinculado"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </SectionShell>
  );
}
