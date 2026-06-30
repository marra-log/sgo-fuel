"use client";

import { useMemo, useState } from "react";
import { CreditCard, Search, User } from "lucide-react";
import { RechargeForm } from "@/components/cartoes/recharge-form";
import { formatBRL } from "@/lib/utils";

export type RecargaCard = {
  id: string;
  card_number: string;
  holder_name: string | null;
  balance_brl: number | null;
  motorista: string | null;
  placa: string | null;
};

export function RecargaCentral({ cards }: { cards: RecargaCard[] }) {
  const [busca, setBusca] = useState("");
  const [selId, setSelId] = useState<string>("");

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.card_number.toLowerCase().includes(q) ||
        (c.motorista ?? "").toLowerCase().includes(q) ||
        (c.placa ?? "").toLowerCase().includes(q) ||
        (c.holder_name ?? "").toLowerCase().includes(q)
    );
  }, [cards, busca]);

  const selected = cards.find((c) => c.id === selId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Selecionar cartão / motorista */}
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="border-b border-[color:var(--color-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Selecione o cartão ou motorista</h2>
          <p className="text-xs text-[color:var(--color-muted)]">Busque por motorista, placa, titular ou número do cartão.</p>
        </div>
        <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-4 py-3">
          <Search className="h-4 w-4 text-[color:var(--color-muted)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar motorista, placa ou cartão…"
            className="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-muted)]"
          />
        </div>
        <div className="max-h-[460px] overflow-y-auto divide-y divide-[color:var(--color-border)]">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[color:var(--color-muted)]">Nenhum cartão encontrado.</div>
          ) : (
            filtered.map((c) => {
              const active = c.id === selId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors " +
                    (active ? "bg-[color:var(--color-brand-soft)]" : "hover:bg-[color:var(--color-surface-2)]")
                  }
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]">
                      {c.motorista ? <User className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[color:var(--color-text-strong)]">
                        {c.motorista ?? c.holder_name ?? "Sem motorista"}
                      </span>
                      <span className="block truncate text-[11px] text-[color:var(--color-muted)]">
                        {c.placa ? `${c.placa} · ` : ""}•••• {c.card_number.slice(-4)}
                      </span>
                    </span>
                  </span>
                  <span className="flex-none font-mono text-sm font-medium text-[color:var(--color-brand)]">
                    {formatBRL(Number(c.balance_brl ?? 0))}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Recarga do cartão selecionado */}
      <div>
        {selected ? (
          <RechargeForm key={selected.id} cardId={selected.id} initialBalance={Number(selected.balance_brl ?? 0)} />
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center text-sm text-[color:var(--color-muted)]">
            Escolha um cartão à esquerda para adicionar saldo.
          </div>
        )}
      </div>
    </div>
  );
}
