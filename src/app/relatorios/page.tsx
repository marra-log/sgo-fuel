import Link from "next/link";
import { ArrowLeft, Fuel } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAnalytics } from "@/lib/analytics";
import { getCurrentTenant } from "@/lib/supabase/tenant";
import { LitrosArea, EventosBar, StatusPie, TopDriversBar, PieLegend } from "@/components/charts";
import { PrintButton } from "@/components/print-button";
import { formatBRL, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const supabase = await createSupabaseServerClient();
  const tenant = await getCurrentTenant();
  const analytics = await loadAnalytics(30);

  // Conciliação resumida por tanque
  const [{ data: tanks }, { data: invoices }, { data: pumps }] = await Promise.all([
    supabase.from("tanks").select("id, name, fuel_type"),
    supabase.from("fiscal_invoices").select("tank_id, volume_l, value_brl"),
    supabase.from("pumps").select("id, tank_id"),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: fuelings } = await supabase
    .from("fuelings")
    .select("pump_id, delivered_l, status, started_at")
    .gte("started_at", monthStart.toISOString());

  const pumpToTank = new Map<string, string>();
  for (const p of (pumps ?? []) as Array<{ id: string; tank_id: string | null }>)
    if (p.tank_id) pumpToTank.set(p.id, p.tank_id);

  const saida = new Map<string, number>();
  for (const f of (fuelings ?? []) as Array<{ pump_id: string; delivered_l: number | null; status: string }>) {
    if (f.status === "BLOCKED") continue;
    const tid = pumpToTank.get(f.pump_id);
    if (tid) saida.set(tid, (saida.get(tid) ?? 0) + Number(f.delivered_l ?? 0));
  }
  const entrada = new Map<string, number>();
  let custoTotal = 0;
  for (const inv of (invoices ?? []) as Array<{ tank_id: string | null; volume_l: number | null; value_brl: number | null }>) {
    custoTotal += Number(inv.value_brl ?? 0);
    if (inv.tank_id) entrada.set(inv.tank_id, (entrada.get(inv.tank_id) ?? 0) + Number(inv.volume_l ?? 0));
  }

  const tanksRows = ((tanks ?? []) as Array<{ id: string; name: string; fuel_type: string }>).map((t) => {
    const e = entrada.get(t.id) ?? 0;
    const s = saida.get(t.id) ?? 0;
    const diff = e - s;
    const pct = e > 0 ? (diff / e) * 100 : 0;
    return { nome: t.name, entrada: e, saida: s, diff, pct };
  });

  const hoje = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Barra de ação — some na impressão */}
      <div className="border-b border-gray-200 bg-[color:var(--color-background)] px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
            <ArrowLeft className="h-3 w-3" /> Voltar ao painel
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Folha do relatório */}
      <div className="mx-auto max-w-4xl px-8 py-10 print:px-0 print:py-0">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-[#19c37d] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#19c37d] text-black">
              <Fuel className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">SGO-Fuel · Relatório Operacional</div>
              <div className="text-sm text-gray-500">{tenant?.name ?? "Empresa"}</div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>Emitido em</div>
            <div className="font-medium text-gray-700">{hoje}</div>
            <div className="mt-1">Período: últimos 30 dias</div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi label="Litros abastecidos" value={`${formatNumber(analytics.totalLitros)} L`} />
          <Kpi label="Eventos" value={String(analytics.totalEventos)} />
          <Kpi label="Bloqueios da IA" value={String(analytics.totalBloqueios)} />
          <Kpi label="Anomalias abertas" value={String(analytics.anomaliasAbertas)} />
        </div>

        {/* Gráficos */}
        <Section title="Volume diário (30 dias)">
          <div className="rounded-lg border border-gray-200 p-3">
            <LitrosArea data={analytics.daily} />
          </div>
        </Section>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Section title="Eventos × Bloqueios">
            <div className="rounded-lg border border-gray-200 p-3">
              <EventosBar data={analytics.daily} />
            </div>
          </Section>
          <Section title="Distribuição por status">
            <div className="rounded-lg border border-gray-200 p-3">
              <StatusPie data={analytics.statusDist} />
              <PieLegend data={analytics.statusDist} />
            </div>
          </Section>
        </div>

        <Section title="Top motoristas por volume">
          <div className="rounded-lg border border-gray-200 p-3">
            <TopDriversBar data={analytics.topDrivers} />
          </div>
        </Section>

        {/* Conciliação */}
        <Section title="Conciliação fiscal por tanque (mês corrente)">
          {tanksRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum tanque cadastrado.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-600">
                  <th className="py-2">Tanque</th>
                  <th className="py-2 text-right">Entrada (NFe)</th>
                  <th className="py-2 text-right">Saída (IoT)</th>
                  <th className="py-2 text-right">Diferença</th>
                  <th className="py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {tanksRows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{r.nome}</td>
                    <td className="py-2 text-right text-gray-700">{formatNumber(Math.round(r.entrada))} L</td>
                    <td className="py-2 text-right text-gray-700">{formatNumber(Math.round(r.saida))} L</td>
                    <td className="py-2 text-right text-gray-700">{formatNumber(Math.round(r.diff))} L</td>
                    <td className={`py-2 text-right font-medium ${r.pct > 1.5 ? "text-red-600" : r.pct > 0.8 ? "text-amber-600" : "text-green-600"}`}>
                      {r.pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Custo total de combustível comprado (NFes importadas): <strong>{formatBRL(custoTotal)}</strong>
          </p>
        </Section>

        <div className="mt-10 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
          SGO-Fuel · Aether IA — Relatório gerado automaticamente. Dados da operação em tempo real.
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 break-inside-avoid">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">{title}</h2>
      {children}
    </div>
  );
}
