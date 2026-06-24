import Link from "next/link";
import { AlertTriangle, ArrowLeft, DollarSign, Droplet, Fuel, TrendingUp, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsumoDeptoBar, HistoricoArea } from "@/components/frota-charts";
import { EMPRESA, DEPARTAMENTOS, HISTORICO, TRANSACOES_INVALIDAS, PRECOS_POSTOS } from "@/lib/frota-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

export const metadata = { title: "SGO-Fuel · Painel do Cliente" };

const STATUS_TONE: Record<string, "success" | "warning" | "info"> = {
  Utilizado: "success",
  "Expirado para Justificação": "warning",
  Pendente: "info",
};

export default function PainelClientePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/frota" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Plataforma Cartão Frota
        </Link>

        {/* Cabeçalho da empresa */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="info" className="mb-2">Painel do Cliente</Badge>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">{EMPRESA.curto}</h1>
            <p className="text-xs text-[color:var(--color-muted)]">{EMPRESA.nome} · CNPJ {EMPRESA.cnpj}</p>
          </div>
          <Link href="/frota/posto" className="text-xs font-medium text-[color:var(--color-brand)] hover:underline">
            Ver gestão do posto →
          </Link>
        </div>

        {/* KPIs (estilo Flagcard) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBig icon={<DollarSign className="h-5 w-5" />} title="Creditado no mês" value={formatBRL(EMPRESA.creditadoMes)} />
          <KpiBig icon={<Fuel className="h-5 w-5" />} title="Consumido em reais" value={formatBRL(EMPRESA.consumidoReais)} />
          <KpiBig icon={<Droplet className="h-5 w-5" />} title="Consumido em litros" value={`${formatNumber(EMPRESA.consumidoLitros)} L`} />
          <KpiBig icon={<Wallet className="h-5 w-5" />} title="Saldo" value={formatBRL(EMPRESA.saldo)} highlight />
        </div>

        {/* Gráficos */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Consumo por departamento (R$)</h2>
            </div>
            <div className="px-3 py-4">
              <ConsumoDeptoBar data={DEPARTAMENTOS} />
            </div>
          </Card>
          <Card>
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Histórico de consumo da empresa (R$)</h2>
            </div>
            <div className="px-3 py-4">
              <HistoricoArea data={HISTORICO} />
            </div>
          </Card>
        </div>

        {/* Transações inválidas */}
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">Transações inválidas passíveis de autorização</h2>
              <p className="text-xs text-[color:var(--color-muted)]">A IA sinaliza inconsistências de KM, consumo e volume.</p>
            </div>
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3" />
              {TRANSACOES_INVALIDAS.length} alertas
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tipo</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Veículo</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {TRANSACOES_INVALIDAS.map((t, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-5 py-3 text-white">{t.tipo}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-[color:var(--color-muted)]">{t.data}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.veiculo}</td>
                    <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{t.placa}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.motorista}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge variant={STATUS_TONE[t.status]}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Preços por estabelecimento */}
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">Preços por estabelecimento</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Preço com desconto negociado ou preço de bomba.</p>
            </div>
            <Badge variant="info"><TrendingUp className="h-3 w-3" /> {PRECOS_POSTOS.length} postos</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Estabelecimento</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Gasolina</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Gas. Aditivada</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Etanol</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Diesel Comum</th>
                  <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Diesel S-10</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {PRECOS_POSTOS.map((p, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{p.posto}</div>
                      <div className="text-[11px] text-[color:var(--color-muted)]">
                        {p.cidade} · <span className={p.tipo === "Desconto" ? "text-[color:var(--color-brand)]" : ""}>{p.tipo === "Desconto" ? "preço com desconto" : "preço de bomba"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.gasolina)}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.gasolinaAditivada)}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.etanol)}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.dieselComum)}</td>
                    <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(p.dieselS10)}</td>
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

function KpiBig({
  icon,
  title,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={"p-5 " + (highlight ? "ring-1 ring-[color:var(--color-brand)]/40" : "")}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div className={"mt-3 text-2xl font-semibold " + (highlight ? "text-[color:var(--color-brand)]" : "text-white")}>{value}</div>
    </Card>
  );
}
