import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Droplet,
  Fuel,
  Gauge,
  MapPin,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostoSerieLine, MixPie, MixLegend } from "@/components/postos-charts";
import { getPosto, POSTOS, FUEL_LABEL, PRECO, type PostoStatus } from "@/lib/postos-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

const STATUS: Record<PostoStatus, { label: string; tone: "success" | "warning" | "outline" }> = {
  ATIVO: { label: "Ativo", tone: "success" },
  ATENCAO: { label: "Atenção", tone: "warning" },
  INATIVO: { label: "Inativo", tone: "outline" },
};

export function generateStaticParams() {
  return POSTOS.map((p) => ({ id: p.id }));
}

export default async function PostoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posto = getPosto(id);
  if (!posto) notFound();

  const st = STATUS[posto.status];
  const mix = posto.mix.map((m) => ({ name: FUEL_LABEL[m.tipo], value: m.litros }));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/postos" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
          <ArrowLeft className="h-3 w-3" /> Voltar para a rede
        </Link>

        {/* Cabeçalho do posto */}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[color:var(--color-text-strong)]">{posto.nome}</h1>
              <Badge variant={st.tone}>{st.label}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-muted)]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {posto.cidade}/{posto.uf}
              </span>
              <span>· {posto.bandeira}</span>
              <span className="inline-flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" /> {posto.gerente}
              </span>
              <span className="inline-flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5" /> {posto.bombas} bombas
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<DollarSign className="h-4 w-4" />} title="Faturamento · mês" value={formatBRL(posto.faturamentoMes)} />
          <Kpi icon={<Droplet className="h-4 w-4" />} title="Litros · mês" value={`${formatNumber(posto.litrosMes)} L`} />
          <Kpi icon={<Gauge className="h-4 w-4" />} title="Ticket médio" value={formatBRL(posto.ticketMedio)} />
          <Kpi icon={<TrendingUp className="h-4 w-4" />} title="Margem" value={`${posto.margemPct}%`} />
        </div>

        {/* Gráficos */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Faturamento · 12 meses</h2>
            </div>
            <div className="px-3 py-4">
              <PostoSerieLine data={posto.serie} />
            </div>
          </Card>
          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Mix do posto</h2>
            </div>
            <div className="px-5 py-4">
              <MixPie data={mix} />
              <MixLegend data={mix} />
            </div>
          </Card>
        </div>

        {/* Vendas por combustível */}
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Vendas por combustível · mês</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Volume × preço médio de venda.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Combustível</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Preço médio</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {posto.mix.map((m) => (
                  <tr key={m.tipo}>
                    <td className="px-5 py-3 font-medium text-[color:var(--color-text-strong)]">{FUEL_LABEL[m.tipo]}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(m.litros)} L</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-muted)]">{formatBRL(PRECO[m.tipo])}</td>
                    <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatBRL(m.litros * PRECO[m.tipo])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

function Kpi({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[color:var(--color-text-strong)]">{value}</div>
    </Card>
  );
}
