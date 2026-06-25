import Link from "next/link";
import { AlertTriangle, ArrowLeft, DollarSign, Droplet, Fuel, Gauge, TrendingUp, Upload, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsumoDeptoBar, HistoricoArea } from "@/components/frota-charts";
import { TransacoesInvalidasInterativo } from "@/components/frota/transacoes-invalidas";
import { SaldosFiltravel } from "@/components/frota/saldos-filtravel";
import { RelatorioDebitos } from "@/components/frota/relatorio-debitos";
import { MapaPostos } from "@/components/frota/mapa-postos";
import {
  EMPRESA,
  DEPARTAMENTOS,
  HISTORICO,
  TRANSACOES_INVALIDAS,
  PRECOS_POSTOS,
  relatorioDebitos,
  relatorioCreditos,
  saldosUsuarios,
  rankingVeiculos,
} from "@/lib/frota-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

export const metadata = { title: "SGO-Fuel · Painel do Cliente" };

const STATUS_TONE: Record<string, "success" | "warning" | "info"> = {
  Utilizado: "success",
  "Expirado para Justificação": "warning",
  Pendente: "info",
};

export default function PainelClientePage() {
  const debitos = relatorioDebitos(14);
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

        {/* Navegação por seção */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: "#visao", label: "Visão geral" },
            { id: "#debitos", label: "Relatório de débitos" },
            { id: "#creditos", label: "Créditos" },
            { id: "#saldos", label: "Saldos por usuário" },
            { id: "#ranking", label: "Ranking de veículos" },
            { id: "#nf", label: "Upload de NF" },
          ].map((l) => (
            <a key={l.id} href={l.id} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs text-[color:var(--color-muted)] hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        {/* KPIs (estilo Flagcard) */}
        <div id="visao" className="scroll-mt-20" />
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

        {/* Transações inválidas (interativo: justificar / aprovar / negar) */}
        <Card className="mt-6 overflow-hidden">
          <TransacoesInvalidasInterativo rows={TRANSACOES_INVALIDAS} />
        </Card>

        {/* Mapa de postos credenciados (geolocalização) */}
        <Card className="mt-6 p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Onde a frota abastece</h2>
            <p className="text-xs text-[color:var(--color-muted)]">Postos credenciados e rotas (geolocalização).</p>
          </div>
          <MapaPostos />
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

        {/* Relatório gerencial de débitos (filtro + busca + export) */}
        <Card id="debitos" className="mt-6 overflow-hidden scroll-mt-20">
          <RelatorioDebitos rows={debitos} />
        </Card>

        {/* Créditos + Saldos */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card id="creditos" className="overflow-hidden scroll-mt-20">
            <div className="border-b border-[color:var(--color-border)] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Relatório gerencial de créditos</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Recargas de saldo por usuário/veículo.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[color:var(--color-surface-2)] text-left">
                    <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Usuário</th>
                    <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                    <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border)]">
                  {relatorioCreditos().map((c, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3 font-mono text-white">{c.usuario}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-[color:var(--color-muted)]">{c.data}</td>
                      <td className="px-5 py-3 text-right font-mono text-[color:var(--color-brand)]">{formatBRL(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card id="saldos" className="overflow-hidden scroll-mt-20">
            <SaldosFiltravel rows={saldosUsuarios()} />
          </Card>
        </div>

        {/* Ranking de veículos */}
        <Card id="ranking" className="mt-6 overflow-hidden scroll-mt-20">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">Ranking de veículos (km/L)</h2>
              <p className="text-xs text-[color:var(--color-muted)]">Consumo mínimo/máximo esperado × realizado.</p>
            </div>
            <Badge variant="info"><Gauge className="h-3 w-3" /> eficiência</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Modelo</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Mín</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Máx</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Realizado</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Odômetro</th>
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Depto</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {rankingVeiculos().map((v, i) => {
                  const ok = v.consumoRealizado >= v.consumoMin;
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 font-mono text-white">{v.placa}</td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">{v.modelo}</td>
                      <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{v.consumoMin.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{v.consumoMax.toFixed(1)}</td>
                      <td className={"px-4 py-3 text-right font-mono " + (ok ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-danger)]")}>{v.consumoRealizado.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{formatNumber(v.odometro)}</td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">{v.departamento}</td>
                      <td className="px-4 py-3 text-right"><Badge variant="success">{v.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Upload de NF */}
        <Card id="nf" className="mt-6 p-6 scroll-mt-20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload de Nota Fiscal (XML)</h2>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                Envie o XML da NFe de compra de combustível. O sistema extrai chave, volume e valor e
                cruza automaticamente com o consumo registrado (conciliação SEFAZ).
              </p>
              <Link href="/conciliacao" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-black hover:bg-[color:var(--color-brand-deep)] hover:text-white">
                <Upload className="h-3 w-3" /> Abrir upload de NF
              </Link>
            </div>
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
