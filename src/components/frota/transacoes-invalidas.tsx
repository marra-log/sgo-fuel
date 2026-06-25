"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, Check, Download, MessageSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TransacaoInvalida } from "@/lib/frota-mock";

type Estado = "PENDENTE" | "JUSTIFICADA" | "APROVADA" | "NEGADA";

export function TransacoesInvalidasInterativo({ rows }: { rows: TransacaoInvalida[] }) {
  const [estados, setEstados] = useState<Record<number, Estado>>({});
  const [justifyOpen, setJustifyOpen] = useState<number | null>(null);
  const [justText, setJustText] = useState("");

  function set(i: number, e: Estado) {
    setEstados((prev) => ({ ...prev, [i]: e }));
  }

  function exportCsv() {
    const head = ["tipo", "data", "veiculo", "placa", "motorista", "situacao"];
    const body = rows.map((r, i) =>
      [r.tipo, r.data, r.veiculo, r.placa, r.motorista, estados[i] ?? "PENDENTE"]
        .map((c) => `"${c}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes-invalidas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const pendentes = rows.filter((_, i) => !estados[i] || estados[i] === "PENDENTE").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--color-text-strong)]">Transações inválidas passíveis de autorização</h2>
          <p className="text-xs text-[color:var(--color-muted)]">A IA sinaliza; o gestor justifica, aprova ou nega.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3" />
            {pendentes} pendentes
          </Badge>
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color:var(--color-surface-2)] text-left">
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Tipo</th>
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Data</th>
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
              <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
              <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {rows.map((t, i) => {
              const e = estados[i] ?? "PENDENTE";
              return (
                <Fragment key={i}>
                  <tr className="align-top">
                    <td className="px-5 py-3 text-[color:var(--color-text-strong)]">{t.tipo}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-[color:var(--color-muted)]">{t.data}</td>
                    <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{t.placa}</td>
                    <td className="px-5 py-3 text-[color:var(--color-muted)]">{t.motorista}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {e === "PENDENTE" ? (
                          <>
                            <button onClick={() => { setJustifyOpen(justifyOpen === i ? null : i); setJustText(""); }} title="Justificar"
                              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-2 py-1 text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
                              <MessageSquare className="h-3 w-3" /> Justificar
                            </button>
                            <button onClick={() => set(i, "APROVADA")} title="Aprovar"
                              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-2 py-1 text-[11px] text-[color:var(--color-brand)]">
                              <Check className="h-3 w-3" /> Aprovar
                            </button>
                            <button onClick={() => set(i, "NEGADA")} title="Negar"
                              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-2 py-1 text-[11px] text-[color:var(--color-danger)]">
                              <X className="h-3 w-3" /> Negar
                            </button>
                          </>
                        ) : (
                          <Badge variant={e === "APROVADA" ? "success" : e === "NEGADA" ? "danger" : "info"}>
                            {e === "APROVADA" ? "Aprovada" : e === "NEGADA" ? "Negada" : "Justificada"}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                  {justifyOpen === i ? (
                    <tr>
                      <td colSpan={5} className="bg-[color:var(--color-surface-2)] px-5 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={justText}
                            onChange={(ev) => setJustText(ev.target.value)}
                            placeholder="Motivo (ex.: hodômetro digitado errado, corrigido pelo motorista)"
                            className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]"
                          />
                          <button
                            onClick={() => { set(i, "JUSTIFICADA"); setJustifyOpen(null); }}
                            disabled={!justText.trim()}
                            className="rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            Salvar justificativa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
