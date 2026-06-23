import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  Droplet,
  Fuel,
  Gauge,
  MapPin,
  Store,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FaturamentoRede,
  LitrosRede,
  TopPostosBar,
  MixPie,
  MixLegend,
} from "@/components/postos-charts";
import {
  POSTOS,
  FUEL_LABEL,
  redeKpis,
  redeSerie,
  redeMix,
  topPostos,
  type PostoStatus,
} from "@/lib/postos-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "SGO-Fuel · Rede de Postos",
};

const STATUS: Record<PostoStatus, { label: string; tone: "success" | "warning" | "outline" }> = {
  ATIVO: { label: "Ativo", tone: "success" },
  ATENCAO: { label: "Atenção", tone: "warning" },
  INATIVO: { label: "Inativo", tone: "outline" },
};

export default function PostosPage() {
  const kpis = redeKpis();
  const serie = redeSerie();
  const mix = redeMix().map((m) => ({ name: FUEL_LABEL[m.tipo], value: m.litros }));
  const top = topPostos(6).map((p) => ({ nome: p.nome.replace("Posto ", "").replace("Auto Posto ", ""), faturamento: p.faturamentoMes }));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="mb-2 inline-block rounded-full border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-medium text-[color:var(--color-brand)]">
              Rede de Postos
            </span>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Gestão da rede</h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
              Visão consolidada de {kpis.totalPostos} postos · faturamento, volume, ticket médio e ranking.
              <span className="ml-1 text-[color:var(--color-muted)]">(dados de demonstração)</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
            {kpis.postosAtivos} de {kpis.totalPostos} operando
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={<DollarSign className="h-4 w-4" />}
            title="Faturamento · mês"
            value={formatBRL(kpis.faturamentoMes)}
            delta="+6,4% vs. mês anterior"
          />
          <Kpi
            icon={<Droplet className="h-4 w-4" />}
            title="Litros vendidos · mês"
            value={`${formatNumber(kpis.litrosMes)} L`}
            delta="+3,1%"
          />
          <Kpi
            icon={<Gauge className="h-4 w-4" />}
            title="Ticket médio"
            value={formatBRL(kpis.ticketMedio)}
            delta={`${formatNumber(kpis.abastecimentos)} abastecimentos`}
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            title="Margem média"
            value={`${kpis.margemMedia}%`}
            delta="meta 9,0%"
          />
        </div>

        {/* Gráficos principais */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Faturamento da rede · 12 meses</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Soma de todos os postos ativos.</p>
            </div>
            <div className="px-3 py-4">
              <FaturamentoRede data={serie} />
            </div>
          </Card>

          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Mix de combustível</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Participação no volume.</p>
            </div>
            <div className="px-5 py-4">
              <MixPie data={mix} />
              <MixLegend data={mix} />
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Volume vendido · 12 meses</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Litros consolidados por mês.</p>
            </div>
            <div className="px-3 py-4">
              <LitrosRede data={serie} />
            </div>
          </Card>

          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Top postos · faturamento</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Mês corrente.</p>
            </div>
            <div className="px-3 py-4">
              <TopPostosBar data={top} />
            </div>
          </Card>
        </div>

        {/* Tabela de postos */}
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">Postos da rede</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Clique para abrir o painel do posto.</p>
            </div>
            <Badge variant="info">
              <Store className="h-3 w-3" />
              {POSTOS.length} unidades
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Posto</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cidade</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Bandeira</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Bombas</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros/mês</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Faturamento</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Margem</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {POSTOS.map((p) => {
                  const st = STATUS[p.status];
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[color:var(--color-surface-2)]/50">
                      <td className="px-5 py-3">
                        <Link href={`/postos/${p.id}`} className="flex items-center gap-2 font-medium text-white hover:text-[color:var(--color-brand)]">
                          <Fuel className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                          {p.nome}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.cidade}/{p.uf}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[color:var(--color-muted)]">{p.bandeira}</td>
                      <td className="px-5 py-3 text-right font-mono text-white">{p.bombas}</td>
                      <td className="px-5 py-3 text-right font-mono text-white">{formatNumber(p.litrosMes)} L</td>
                      <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.faturamentoMes)}</td>
                      <td className="px-5 py-3 text-right font-mono text-white">{p.margemPct}%</td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={st.tone}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
            Ir para o Portal do Gestor (frota) →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Kpi({
  icon,
  title,
  value,
  delta,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--color-brand)]">
        <ArrowUpRight className="h-3 w-3" />
        {delta}
      </div>
    </Card>
  );
}
