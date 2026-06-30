"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, Search, Wallet, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber } from "@/lib/utils";

export type TxRow = {
  id: string;
  card_number: string | null;
  liters: number;
  price_per_l: number;
  amount_brl: number;
  status: string;
  decline_reason: string | null;
  created_at: string;
  motorista: string | null;
  placa: string | null;
};

const PERIODS = [
  { key: "1", label: "Hoje" },
  { key: "7", label: "7 dias" },
  { key: "30", label: "30 dias" },
  { key: "all", label: "Tudo" },
];

function maskCard(n: string | null) {
  if (!n) return "—";
  return n.length > 4 ? `•••• ${n.slice(-4)}` : n;
}

export function TransacoesClient({ rows, saldoCartoes }: { rows: TxRow[]; saldoCartoes: number | null }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("ALL");
  const [period, setPeriod] = useState("30");

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const now = Date.now();
    const cutoff = period === "all" ? 0 : now - Number(period) * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (status !== "ALL" && r.status !== status) return false;
      if (!q) return true;
      return (
        (r.card_number ?? "").toLowerCase().includes(q) ||
        (r.motorista ?? "").toLowerCase().includes(q) ||
        (r.placa ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, busca, status, period]);

  const aprovadas = filtered.filter((r) => r.status === "APPROVED");
  const negadas = filtered.filter((r) => r.status === "DECLINED");
  const totalDebitado = aprovadas.reduce((a, r) => a + Number(r.amount_brl), 0);
  const ticket = aprovadas.length ? totalDebitado / aprovadas.length : 0;

  function exportCsv() {
    const head = ["data", "cartao", "motorista", "placa", "litros", "preco_l", "valor", "status", "motivo"];
    const body = filtered.map((r) =>
      [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.card_number ?? "",
        r.motorista ?? "",
        r.placa ?? "",
        r.liters,
        Number(r.price_per_l).toFixed(2),
        Number(r.amount_brl).toFixed(2),
        r.status === "APPROVED" ? "Aprovada" : "Negada",
        r.decline_reason ?? "",
      ]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes-cartao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Debitado no período" value={formatBRL(totalDebitado)} tone="brand" />
        <Kpi title="Aprovadas" value={String(aprovadas.length)} sub={`ticket médio ${formatBRL(ticket)}`} />
        <Kpi title="Negadas" value={String(negadas.length)} tone={negadas.length ? "danger" : undefined} />
        {saldoCartoes != null ? (
          <Kpi title="Saldo em cartões" value={formatBRL(saldoCartoes)} icon={<Wallet className="h-3.5 w-3.5" />} />
        ) : (
          <Kpi title="Transações" value={String(filtered.length)} />
        )}
      </div>

      {/* Filtros + tabela */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Cartão, motorista ou placa"
                className="w-44 bg-transparent text-xs text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)]"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none">
              <option value="ALL">Todos os status</option>
              <option value="APPROVED">Aprovadas</option>
              <option value="DECLINED">Negadas</option>
            </select>
            <div className="flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={
                    "rounded px-2 py-1 text-[11px] transition-colors " +
                    (period === p.key ? "bg-[color:var(--color-brand)] text-black" : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[color:var(--color-muted)]">{filtered.length} de {rows.length}</span>
            <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[color:var(--color-muted)]">
            Nenhuma transação no período. Use a Maquininha ou o Totem para gerar movimento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[color:var(--color-surface-2)] text-left">
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Cartão</th>
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
                  <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Veículo</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Litros</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
                  <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[color:var(--color-surface-2)]/40">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[color:var(--color-muted)]">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-mono text-[color:var(--color-text-strong)]">{maskCard(r.card_number)}</td>
                    <td className="px-4 py-3 text-[color:var(--color-muted)]">{r.motorista ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-[color:var(--color-muted)]">{r.placa ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(r.liters)} L</td>
                    <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatBRL(r.amount_brl)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "APPROVED" ? (
                        <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Aprovada</Badge>
                      ) : (
                        <Badge variant="danger" title={r.decline_reason ?? ""}><XCircle className="h-3 w-3" /> Negada</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ title, value, sub, tone, icon }: { title: string; value: string; sub?: string; tone?: "brand" | "danger"; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {icon} {title}
      </div>
      <div
        className={
          "mt-1.5 text-2xl font-semibold " +
          (tone === "brand" ? "text-[color:var(--color-brand)]" : tone === "danger" ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-text-strong)]")
        }
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">{sub}</div> : null}
    </Card>
  );
}
