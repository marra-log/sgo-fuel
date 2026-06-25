"use client";

import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import type { SaldoRow } from "@/lib/frota-mock";
import { formatBRL } from "@/lib/utils";

export function SaldosFiltravel({ rows }: { rows: SaldoRow[] }) {
  const [depto, setDepto] = useState("ALL");
  const [centro, setCentro] = useState("ALL");

  const deptos = useMemo(() => Array.from(new Set(rows.map((r) => r.departamento))), [rows]);
  const centros = useMemo(() => Array.from(new Set(rows.map((r) => r.centroCusto))), [rows]);

  const filtered = rows.filter(
    (r) => (depto === "ALL" || r.departamento === depto) && (centro === "ALL" || r.centroCusto === centro)
  );
  const total = filtered.reduce((a, r) => a + r.saldoAtual, 0);

  function exportCsv() {
    const head = ["usuario", "departamento", "funcao", "centro_custo", "saldo_atual", "ultima_atualizacao"];
    const body = filtered.map((r) =>
      [r.usuario, r.departamento, r.funcao, r.centroCusto, r.saldoAtual.toFixed(2), r.ultimaAtualizacao].map((c) => `"${c}"`).join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saldos-por-usuario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-white">Saldos por usuário</h2>
          <p className="text-xs text-[color:var(--color-muted)]">Filtre por departamento e centro de custo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
          <select value={depto} onChange={(e) => setDepto(e.target.value)} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1 text-xs text-white outline-none">
            <option value="ALL">Todo depto</option>
            {deptos.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={centro} onChange={(e) => setCentro(e.target.value)} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1 text-xs text-white outline-none">
            <option value="ALL">Todo centro</option>
            {centros.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-xs text-white hover:bg-[color:var(--color-surface-2)]">
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr className="bg-[color:var(--color-surface-2)] text-left">
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Usuário</th>
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Depto</th>
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Centro</th>
              <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {filtered.map((s, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-mono text-white">{s.usuario}</td>
                <td className="px-5 py-3 text-[color:var(--color-muted)]">{s.departamento}</td>
                <td className="px-5 py-3 text-[color:var(--color-muted)]">{s.centroCusto}</td>
                <td className="px-5 py-3 text-right font-mono text-white">{formatBRL(s.saldoAtual)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
              <td className="px-5 py-3 font-semibold text-white" colSpan={3}>Total filtrado</td>
              <td className="px-5 py-3 text-right font-mono font-semibold text-[color:var(--color-brand)]">{formatBRL(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
