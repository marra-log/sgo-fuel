import Link from "next/link";
import { Ban, CheckCircle2, CreditCard, Droplet, FileText, Receipt } from "lucide-react";
import { SectionShell } from "@/components/section-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/tenant";
import { formatBRL, formatNumber } from "@/lib/utils";
import { FaturamentoExport, FaturaPix, type FaturaLinha } from "./faturamento-export";

export const dynamic = "force-dynamic";

type Tx = {
  card_number: string | null;
  liters: number;
  amount_brl: number;
  status: string;
  created_at: string;
  fleet_cards: { holder_name: string | null; drivers: { name: string } | null } | null;
};

export default async function FaturamentoPage() {
  const supabase = await createSupabaseServerClient();
  const tenant = await getCurrentTenant();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodoLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const periodoKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("card_transactions")
    .select("card_number, liters, amount_brl, status, created_at, fleet_cards(holder_name, drivers(name))")
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: false });

  const txs = (data ?? []) as unknown as Tx[];
  const aprovadas = txs.filter((t) => t.status === "APPROVED");
  const negadas = txs.filter((t) => t.status === "DECLINED");

  // Agrupa por cartão
  const grupo = new Map<string, FaturaLinha>();
  for (const t of aprovadas) {
    const key = t.card_number ?? "—";
    const prev = grupo.get(key) ?? {
      cartao: key.length > 4 ? `•••• ${key.slice(-4)}` : key,
      titular: t.fleet_cards?.holder_name ?? "—",
      motorista: t.fleet_cards?.drivers?.name ?? "—",
      transacoes: 0,
      litros: 0,
      valor: 0,
    };
    prev.transacoes += 1;
    prev.litros += Number(t.liters);
    prev.valor += Number(t.amount_brl);
    grupo.set(key, prev);
  }
  const linhas = Array.from(grupo.values()).sort((a, b) => b.valor - a.valor);

  const totalValor = linhas.reduce((a, l) => a + l.valor, 0);
  const totalLitros = linhas.reduce((a, l) => a + l.litros, 0);
  const valorNegado = negadas.reduce((a, t) => a + Number(t.amount_brl), 0);

  return (
    <SectionShell
      badge="Faturamento · Cartões"
      title="Fechamento do período"
      description="Consolidação das transações de cartão para cobrança. É assim que os valores são lançados: cada passada aprovada entra na fatura; as negadas mostram o desvio evitado."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-[color:var(--color-muted)]">
          Período: <span className="text-[color:var(--color-text-strong)]">{periodoLabel}</span> · {tenant?.name ?? "Empresa"}
        </div>
        <div className="flex items-center gap-2">
          <FaturamentoExport linhas={linhas} periodo={periodoKey} />
          <PrintButton label="Imprimir / PDF" />
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-sm text-[color:var(--color-danger)]">
          {error.message}
          <div className="mt-2 text-xs text-[color:var(--color-muted)]">
            Se a tabela não existe, rode <code className="rounded bg-[color:var(--color-surface-2)] px-1">supabase/cards.sql</code>.
          </div>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={<Receipt className="h-4 w-4" />} title="Total a faturar" value={formatBRL(totalValor)} tone="brand" />
            <Kpi icon={<Droplet className="h-4 w-4" />} title="Litros no período" value={`${formatNumber(Math.round(totalLitros))} L`} />
            <Kpi icon={<CheckCircle2 className="h-4 w-4" />} title="Transações aprovadas" value={String(aprovadas.length)} />
            <Kpi icon={<Ban className="h-4 w-4" />} title="Negadas (desvio evitado)" value={`${negadas.length} · ${formatBRL(valorNegado)}`} tone="danger" />
          </div>

          {/* Fatura por cartão */}
          <Card className="mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Fatura por cartão</h2>
                <p className="text-xs text-[color:var(--color-muted)]">Valor consolidado a lançar por cartão/motorista.</p>
              </div>
              <Badge variant="info">
                <CreditCard className="h-3 w-3" />
                {linhas.length} cartões
              </Badge>
            </div>
            {linhas.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <FileText className="mx-auto h-7 w-7 text-[color:var(--color-muted)]" />
                <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                  Nenhuma transação aprovada no período. Use a{" "}
                  <Link href="/maquininha" className="text-[color:var(--color-brand)] hover:underline">Maquininha</Link>{" "}
                  para gerar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[color:var(--color-surface-2)] text-left">
                      <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cartão</th>
                      <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Titular</th>
                      <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                      <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Transações</th>
                      <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                      <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border)]">
                    {linhas.map((l, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3 font-mono text-[color:var(--color-text-strong)]">{l.cartao}</td>
                        <td className="px-5 py-3 text-[color:var(--color-muted)]">{l.titular}</td>
                        <td className="px-5 py-3 text-[color:var(--color-muted)]">{l.motorista}</td>
                        <td className="px-5 py-3 text-right text-[color:var(--color-text-strong)]">{l.transacoes}</td>
                        <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(Math.round(l.litros))} L</td>
                        <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatBRL(l.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
                      <td className="px-5 py-3 font-semibold text-[color:var(--color-text-strong)]" colSpan={4}>Total a faturar</td>
                      <td className="px-5 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(Math.round(totalLitros))} L</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-[color:var(--color-brand)]">{formatBRL(totalValor)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          {linhas.length > 0 ? (
            <div className="mt-4">
              <FaturaPix total={totalValor} periodo={periodoKey} />
            </div>
          ) : null}

          <p className="mt-4 text-xs text-[color:var(--color-muted)]">
            Como funciona a cobrança: este valor é a fatura fechada da frota no período. A empresa
            cobra o cliente (transportadora) por esse total — gere o Pix acima (recebimento direto na
            conta da empresa, sem adquirente) ou emita boleto. Quando houver liquidação via adquirente,
            o mesmo número alimenta o repasse.
          </p>
        </>
      )}
    </SectionShell>
  );
}

function Kpi({
  icon,
  title,
  value,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tone?: "brand" | "danger";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">{title}</span>
        <span className="text-[color:var(--color-muted)]">{icon}</span>
      </div>
      <div
        className={
          "mt-3 text-2xl font-semibold " +
          (tone === "brand" ? "text-[color:var(--color-brand)]" : tone === "danger" ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-text-strong)]")
        }
      >
        {value}
      </div>
    </Card>
  );
}
