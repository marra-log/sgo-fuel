import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Droplet,
  Gauge,
  MapPin,
  Plus,
  Receipt,
  Store,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HistoricoArea } from "@/components/frota-charts";
import {
  POSTO_KPIS,
  PRECOS_POSTOS,
  HISTORICO,
  cartoesFrota,
  transacoesRecentes,
  novosCartoes,
} from "@/lib/frota-mock";
import { CartoesGestao } from "@/components/frota/cartoes-gestao";
import { formatBRL, formatNumber } from "@/lib/utils";

export const metadata = { title: "SGO-Fuel · Gestão do Posto" };

export default function GestaoPostoPage() {
  const cartoes = cartoesFrota();
  const txs = transacoesRecentes(12);
  const novos = novosCartoes();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/frota" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Plataforma Cartão Frota
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="info" className="mb-2">Gestão do Posto / Rede</Badge>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Administração da rede credenciada</h1>
            <p className="text-xs text-[color:var(--color-muted)]">Métricas, cadastros e tabela de preços (dados de demonstração).</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<DollarSign className="h-4 w-4" />} title="Faturamento · mês" value={formatBRL(POSTO_KPIS.faturamentoMes)} />
          <Kpi icon={<Droplet className="h-4 w-4" />} title="Litros vendidos" value={`${formatNumber(POSTO_KPIS.litrosMes)} L`} />
          <Kpi icon={<Receipt className="h-4 w-4" />} title="Transações" value={formatNumber(POSTO_KPIS.transacoes)} />
          <Kpi icon={<Gauge className="h-4 w-4" />} title="Ticket médio" value={formatBRL(POSTO_KPIS.ticketMedio)} />
        </div>

        {/* Atalhos de cadastro */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <CadastroCard icon={<Store className="h-5 w-5" />} title="Cadastro de postos" count={`${POSTO_KPIS.postosRede} ativos`} href="#postos" />
          <CadastroCard icon={<CreditCard className="h-5 w-5" />} title="Cadastro de cartões" count={`${POSTO_KPIS.cartoesAtivos} ativos`} href="#cartoes" />
          <CadastroCard icon={<DollarSign className="h-5 w-5" />} title="Tabela de preços" count={`${PRECOS_POSTOS.length} estabelecimentos`} href="#precos" />
        </div>

        {/* Histórico */}
        <Card className="mt-6">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Faturamento da rede · 12 meses (R$)</h2>
          </div>
          <div className="px-3 py-4">
            <HistoricoArea data={HISTORICO} />
          </div>
        </Card>

        {/* Postos */}
        <Card id="postos" className="mt-6 overflow-hidden scroll-mt-20">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Postos credenciados</h2>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white">
              <Plus className="h-3 w-3" /> Novo posto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Posto</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cidade</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tabela</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Diesel S-10</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {PRECOS_POSTOS.map((p, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <MapPin className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                        {p.posto}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{p.cidade}</td>
                    <td className="px-5 py-3">
                      <Badge variant={p.tipo === "Desconto" ? "success" : "outline"}>{p.tipo === "Desconto" ? "Desconto" : "Bomba"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.dieselS10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cartões */}
        <Card id="cartoes" className="mt-6 overflow-hidden scroll-mt-20">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Cartões emitidos</h2>
            <Link href="/cartoes/novo" className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white">
              <Plus className="h-3 w-3" /> Emitir cartão (real)
            </Link>
          </div>
          <CartoesGestao rows={cartoes} />
        </Card>

        {/* Novos cartões */}
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Novos cartões emitidos</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Últimas emissões com número e data.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Usuário</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cartão</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {novos.map((n, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-mono text-white">{n.usuario}</td>
                    <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{n.cartao}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{n.data}</td>
                    <td className="px-5 py-3 text-right text-[color:var(--color-muted)]">{n.hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transações recentes */}
        <Card id="precos" className="mt-6 overflow-hidden scroll-mt-20">
          <div className="border-b border-[color:var(--color-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-white">Transações recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Posto</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Combustível</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {txs.map((t, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 whitespace-nowrap text-[color:var(--color-muted)]">{t.data}</td>
                    <td className="px-5 py-3 text-white">{t.posto}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.motorista}</td>
                    <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{t.placa}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.combustivel}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatNumber(t.litros)} L</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(t.valor)}</td>
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
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </Card>
  );
}

function CadastroCard({ icon, title, count, href }: { icon: React.ReactNode; title: string; count: string; href: string }) {
  return (
    <Link href={href} className="group">
      <Card className="flex items-center gap-3 p-4 transition-colors hover:border-[color:var(--color-brand)]/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">{icon}</div>
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-[color:var(--color-muted)]">{count}</div>
        </div>
      </Card>
    </Link>
  );
}
