"use client";

import { Fragment, useState } from "react";
import { Lock, Settings, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CartaoFrota } from "@/lib/frota-mock";
import { formatBRL } from "@/lib/utils";

export function CartoesGestao({ rows }: { rows: CartaoFrota[] }) {
  const [status, setStatus] = useState<Record<number, "Ativo" | "Bloqueado">>(
    Object.fromEntries(rows.map((c, i) => [i, c.status]))
  );
  const [limitesOpen, setLimitesOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setStatus((prev) => ({ ...prev, [i]: prev[i] === "Ativo" ? "Bloqueado" : "Ativo" }));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[color:var(--color-surface-2)] text-left">
            <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Cartão</th>
            <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Motorista</th>
            <th className="px-5 py-3 font-medium text-[color:var(--color-muted)]">Placa</th>
            <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Consumido / Limite</th>
            <th className="px-5 py-3 text-right font-medium text-[color:var(--color-muted)]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-border)]">
          {rows.map((c, i) => {
            const st = status[i];
            return (
              <Fragment key={i}>
                <tr>
                  <td className="px-5 py-3 font-mono text-white">{c.numero}</td>
                  <td className="px-5 py-3 text-[color:var(--color-muted)]">{c.motorista}</td>
                  <td className="px-5 py-3 font-mono text-[color:var(--color-muted)]">{c.placa}</td>
                  <td className="px-5 py-3 text-right font-mono text-white">
                    {formatBRL(c.consumido)} <span className="text-[color:var(--color-muted)]">/ {formatBRL(c.limite)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Badge variant={st === "Ativo" ? "success" : "warning"}>{st}</Badge>
                      <button onClick={() => setLimitesOpen(limitesOpen === i ? null : i)} title="Limites"
                        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-2 py-1 text-[11px] text-[color:var(--color-muted)] hover:text-white">
                        <Settings className="h-3 w-3" /> Limites
                      </button>
                      <button onClick={() => toggle(i)} title={st === "Ativo" ? "Bloquear" : "Desbloquear"}
                        className={
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] " +
                          (st === "Ativo"
                            ? "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]"
                            : "border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]")
                        }>
                        {st === "Ativo" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {st === "Ativo" ? "Bloquear" : "Desbloquear"}
                      </button>
                    </div>
                  </td>
                </tr>
                {limitesOpen === i ? (
                  <tr>
                    <td colSpan={5} className="bg-[color:var(--color-surface-2)] px-5 py-4">
                      <div className="text-xs font-medium text-white">Regras e limites do cartão</div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <LimiteCampo label="Limite por dia (R$)" valor="1.500" />
                        <LimiteCampo label="Limite por transação (L)" valor="300" />
                        <LimiteCampo label="Combustível permitido" valor="Diesel S10" />
                        <LimiteCampo label="Horário permitido" valor="05h–22h" />
                      </div>
                      <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                        Demonstração — na operação real, estes limites são aplicados na autorização do abastecimento.
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
  );
}

function LimiteCampo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{valor}</div>
    </div>
  );
}
