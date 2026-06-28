"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Multa } from "@/lib/multas-mock";
import { formatBRL } from "@/lib/utils";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  PAGA: "success",
  PENDENTE: "warning",
  VENCIDA: "danger",
  RECURSO: "info",
};
const STATUS_LABEL: Record<string, string> = {
  PAGA: "Paga",
  PENDENTE: "Pendente",
  VENCIDA: "Vencida",
  RECURSO: "Em recurso",
};

export function MultasTabela({ rows }: { rows: Multa[] }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = rows.filter((m) => {
    const q = busca.trim().toLowerCase();
    const mb = !q || m.placa.toLowerCase().includes(q) || m.motorista.toLowerCase().includes(q) || m.infracao.toLowerCase().includes(q);
    const ms = status === "ALL" || m.status === status;
    return mb && ms;
  });

  function exportCsv() {
    const head = ["id", "placa", "motorista", "infracao", "orgao", "local", "data", "vencimento", "pontos", "valor", "gravidade", "status"];
    const body = filtered.map((m) =>
      [m.id, m.placa, m.motorista, m.infracao, m.orgao, m.local, m.data, m.vencimento, m.pontos, m.valor.toFixed(2), m.gravidade, STATUS_LABEL[m.status]]
        .map((c) => `"${c}"`).join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "multas.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-border)] px-5 py-3">
        <div className="flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar placa, motorista ou infração"
            className="w-56 bg-transparent text-xs text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)]" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-xs text-[color:var(--color-text-strong)] outline-none">
          <option value="ALL">Todos status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="VENCIDA">Vencidas</option>
          <option value="RECURSO">Em recurso</option>
          <option value="PAGA">Pagas</option>
        </select>
        <span className="text-xs text-[color:var(--color-muted)]">{filtered.length} de {rows.length}</span>
        <button onClick={exportCsv} className="ml-auto inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
          <Download className="h-3 w-3" /> CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color:var(--color-surface-2)] text-left">
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Auto</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Infração</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Órgão</th>
              <th className="px-4 py-3 font-medium text-[color:var(--color-muted)]">Vencimento</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Pontos</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Valor</th>
              <th className="px-4 py-3 text-right font-medium text-[color:var(--color-muted)]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-muted)]">{m.id}</td>
                <td className="px-4 py-3 font-mono text-[color:var(--color-text-strong)]">{m.placa}</td>
                <td className="px-4 py-3">
                  <div className="text-[color:var(--color-text-strong)]">{m.infracao}</div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">{m.gravidade} · {m.local}</div>
                </td>
                <td className="px-4 py-3 text-[color:var(--color-muted)]">{m.orgao}</td>
                <td className="px-4 py-3 text-[color:var(--color-muted)]">{m.vencimento}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{m.pontos}</td>
                <td className="px-4 py-3 text-right font-mono text-[color:var(--color-text-strong)]">{formatBRL(m.valor)}</td>
                <td className="px-4 py-3 text-right"><Badge variant={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
