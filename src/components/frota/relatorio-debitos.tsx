"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import type { DebitoRow } from "@/lib/frota-mock";
import { formatBRL, formatNumber } from "@/lib/utils";

export function RelatorioDebitos({ rows }: { rows: DebitoRow[] }) {
  const [busca, setBusca] = useState("");
  const [estab, setEstab] = useState("ALL");

  const estabs = useMemo(() => Array.from(new Set(rows.map((r) => r.estabelecimento))), [rows]);

  const filtered = rows.filter((r) => {
    const q = busca.trim().toLowerCase();
    const matchBusca = !q || r.placa.toLowerCase().includes(q) || r.motorista.toLowerCase().includes(q);
    const matchEstab = estab === "ALL" || r.estabelecimento === estab;
    return matchBusca && matchEstab;
  });

  const totalValor = filtered.reduce((a, r) => a + r.total, 0);
  const totalLitros = filtered.reduce((a, r) => a + r.quantidade, 0);

  function exportCsv() {
    const head = ["placa", "motorista", "km", "consumo_medio", "estabelecimento", "data", "litros", "valor", "desconto", "total"];
    const body = filtered.map((d) =>
      [d.placa, d.motorista, d.km, d.consumoMedio, d.estabelecimento, d.data, d.quantidade, d.valor.toFixed(2), d.desconto.toFixed(2), d.total.toFixed(2)]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-debitos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Relatório gerencial de débitos</h2>
          <p className="text-xs text-[color:var(--color-muted)]">Filtre por placa/motorista, estabelecimento e exporte.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-xs text-[color:var(--color-muted)]">01/06/2026</span>
          <span className="text-xs text-[color:var(--color-muted)]">→</span>
          <span className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-xs text-[color:var(--color-muted)]">24/06/2026</span>
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
            <Download className="h-3 w-3" /> Excel/CSV
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
            <Printer className="h-3 w-3" /> PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] px-5 py-3">
        <div className="flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por placa ou motorista"
            className="w-48 bg-transparent text-xs text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)]"
          />
        </div>
        <select value={estab} onChange={(e) => setEstab(e.target.value)} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none">
          <option value="ALL">Todo estabelecimento</option>
          {estabs.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-xs text-[color:var(--color-muted)]">{filtered.length} de {rows.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color:var(--color-surface-2)] text-left">
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Veículo</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">KM</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Cons. médio</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Estabelecimento</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Qtd (L)</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Desc.</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {filtered.map((d, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-mono text-[color:var(--color-text-strong)]">{d.placa}</td>
                <td className="px-4 py-3 text-[color:var(--color-muted)]">{d.motorista}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{formatNumber(d.km)}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{d.consumoMedio.toFixed(2)}</td>
                <td className="px-4 py-3 text-[color:var(--color-muted)]">{d.estabelecimento}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[color:var(--color-muted)]">{d.data}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(d.quantidade)}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{formatBRL(d.valor)}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-muted)]">{formatBRL(d.desconto)}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatBRL(d.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
              <td className="px-4 py-3 font-semibold text-[color:var(--color-text-strong)]" colSpan={6}>Total filtrado</td>
              <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatNumber(Math.round(totalLitros))}</td>
              <td className="px-4 py-3" colSpan={2} />
              <td className="px-4 py-3 text-right font-mono font-semibold text-[color:var(--color-brand)]">{formatBRL(totalValor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
