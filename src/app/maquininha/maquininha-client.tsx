"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Nfc, Receipt, XCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatBRL, formatNumber } from "@/lib/utils";

type Pump = {
  id: string;
  serial_number: string;
  yards: { name: string } | null;
  partner_station: string | null;
};
type CardLite = { card_number: string; holder_name: string | null; status: string };

type Receipt = {
  ok: boolean;
  reason?: string;
  card: string;
  holder?: string | null;
  liters: number;
  price: number;
  amount: number;
  at: string;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "ativo",
  BLOCKED: "bloqueado",
  LOST: "perdido",
};

export function MaquininhaClient({ pumps, cards }: { pumps: Pump[]; cards: CardLite[] }) {
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [liters, setLiters] = useState("100");
  const [price, setPrice] = useState("6.12");
  const [pumpId, setPumpId] = useState(pumps[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function autorizar() {
    setBusy(true);
    setReceipt(null);
    const supabase = createSupabaseBrowserClient();

    const { data: member } = await supabase.from("tenant_members").select("tenant_id").limit(1).maybeSingle();
    const tenantId = member?.tenant_id;
    if (!tenantId) {
      setBusy(false);
      setReceipt(makeReceipt(false, "Conta sem empresa.", cardNumber, null, 0, 0));
      return;
    }

    const litersN = Number(liters || 0);
    const priceN = Number(price || 0);
    const amount = Math.round(litersN * priceN * 100) / 100;
    const clean = cardNumber.replace(/\s/g, "");

    // Busca cartão
    const { data: card } = await supabase
      .from("fleet_cards")
      .select("id, card_number, holder_name, status, monthly_limit_l, pin, driver_id, vehicle_id")
      .eq("card_number", clean)
      .maybeSingle();

    let ok = true;
    let reason = "";

    if (!card) {
      ok = false;
      reason = "Cartão não reconhecido nesta rede.";
    } else if (card.status !== "ACTIVE") {
      ok = false;
      reason = `Cartão ${STATUS_LABEL[card.status] ?? "inválido"}.`;
    } else if (card.pin && pin && card.pin !== pin) {
      ok = false;
      reason = "PIN incorreto.";
    } else if (card.pin && !pin) {
      ok = false;
      reason = "PIN obrigatório para este cartão.";
    } else {
      // Cota do mês
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: txs } = await supabase
        .from("card_transactions")
        .select("liters, status, created_at")
        .eq("card_id", card.id)
        .eq("status", "APPROVED")
        .gte("created_at", monthStart.toISOString());
      const usado = (txs ?? []).reduce((a, t) => a + Number(t.liters), 0);
      if (usado + litersN > Number(card.monthly_limit_l)) {
        ok = false;
        reason = `Cota mensal excedida (resta ${formatNumber(Math.max(0, Number(card.monthly_limit_l) - usado))} L).`;
      }
    }

    // Registra a transação (aprovada ou negada)
    await supabase.from("card_transactions").insert({
      tenant_id: tenantId,
      card_id: card?.id ?? null,
      card_number: clean,
      pump_id: pumpId || null,
      driver_id: card?.driver_id ?? null,
      vehicle_id: card?.vehicle_id ?? null,
      liters: litersN,
      price_per_l: priceN,
      amount_brl: amount,
      status: ok ? "APPROVED" : "DECLINED",
      decline_reason: ok ? null : reason,
    });

    // Se aprovado e cartão tem vínculo, gera um abastecimento autorizado
    if (ok && card?.driver_id && card?.vehicle_id && pumpId) {
      await supabase.from("fuelings").insert({
        tenant_id: tenantId,
        pump_id: pumpId,
        vehicle_id: card.vehicle_id,
        driver_id: card.driver_id,
        quota_l: litersN,
        delivered_l: litersN,
        status: "COMPLETED",
        cost_brl: amount,
      });
    }

    setReceipt(makeReceipt(ok, reason, clean, card?.holder_name ?? null, litersN, priceN));
    setBusy(false);
  }

  function makeReceipt(
    ok: boolean,
    reason: string,
    card: string,
    holder: string | null,
    litersN: number,
    priceN: number
  ): Receipt {
    return {
      ok,
      reason: ok ? undefined : reason,
      card: card.length > 4 ? `•••• ${card.slice(-4)}` : card,
      holder,
      liters: litersN,
      price: priceN,
      amount: Math.round(litersN * priceN * 100) / 100,
      at: new Date().toLocaleString("pt-BR"),
    };
  }

  return (
    <div className="grid-backdrop min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/cartoes" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-white">
          <ArrowLeft className="h-3 w-3" /> Cartões de frota
        </Link>

        {/* Carcaça do terminal */}
        <div className="mt-3 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">SGO-Fuel POS · A920</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[color:var(--color-brand)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-brand)]" /> online
            </span>
          </div>

          <div className="mt-2 rounded-[18px] bg-black p-4">
            {!receipt ? (
              <>
                <div className="flex items-center gap-2 text-white">
                  <CreditCard className="h-4 w-4 text-[color:var(--color-brand)]" />
                  <span className="text-sm font-semibold">Autorizar abastecimento</span>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Número do cartão ou aproxime a tag
                  </span>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="7000 0000 0000 0000"
                    className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[color:var(--color-brand)]"
                  />
                </label>

                {cards.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cards.slice(0, 4).map((c) => (
                      <button
                        key={c.card_number}
                        onClick={() => setCardNumber(c.card_number)}
                        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] text-[color:var(--color-muted)] hover:text-white"
                        title={c.holder_name ?? ""}
                      >
                        <Nfc className="h-3 w-3" />
                        •{c.card_number.slice(-4)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] text-[color:var(--color-warning)]">
                    Nenhum cartão emitido. Emita em /cartoes primeiro.
                  </p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Litros</span>
                    <input value={liters} onChange={(e) => setLiters(e.target.value)} type="number" min={0}
                      className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-white outline-none focus:border-[color:var(--color-brand)]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">R$/L</span>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} step="0.01"
                      className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-white outline-none focus:border-[color:var(--color-brand)]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">PIN</span>
                    <input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} inputMode="numeric"
                      className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-white outline-none focus:border-[color:var(--color-brand)]" placeholder="••••" />
                  </label>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Bomba</span>
                  <select value={pumpId} onChange={(e) => setPumpId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--color-brand)]">
                    {pumps.length === 0 ? <option value="">Sem bomba</option> : null}
                    {pumps.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.serial_number} · {p.yards?.name ?? p.partner_station ?? "—"}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-[color:var(--color-surface)] px-3 py-2">
                  <span className="text-xs text-[color:var(--color-muted)]">Total</span>
                  <span className="font-mono text-lg font-semibold text-white">
                    {formatBRL((Number(liters) || 0) * (Number(price) || 0))}
                  </span>
                </div>

                <button
                  onClick={autorizar}
                  disabled={busy || !cardNumber}
                  className="mt-4 w-full rounded-xl bg-[color:var(--color-brand)] py-3 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {busy ? "Processando…" : "Autorizar"}
                </button>
              </>
            ) : (
              <ReceiptView receipt={receipt} onNew={() => { setReceipt(null); setPin(""); }} />
            )}
          </div>

          <div className="mt-3 px-1 text-center text-[10px] text-[color:var(--color-muted)]">
            Terminal de demonstração · valida cota, status e PIN do cartão private label
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptView({ receipt, onNew }: { receipt: Receipt; onNew: () => void }) {
  return (
    <div className="text-center">
      <div
        className={
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full " +
          (receipt.ok ? "bg-[color:var(--color-brand-soft)]" : "bg-[color:var(--color-danger)]/15")
        }
      >
        {receipt.ok ? (
          <CheckCircle2 className="h-8 w-8 text-[color:var(--color-brand)]" />
        ) : (
          <XCircle className="h-8 w-8 text-[color:var(--color-danger)]" />
        )}
      </div>
      <div className={"mt-3 text-lg font-semibold " + (receipt.ok ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-danger)]")}>
        {receipt.ok ? "APROVADO" : "NEGADO"}
      </div>
      {!receipt.ok ? <div className="mt-1 text-xs text-[color:var(--color-muted)]">{receipt.reason}</div> : null}

      <div className="mt-4 space-y-1.5 rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-left text-xs">
        <Row label="Cartão" value={receipt.card} />
        {receipt.holder ? <Row label="Titular" value={receipt.holder} /> : null}
        <Row label="Litros" value={`${formatNumber(receipt.liters)} L`} />
        <Row label="Preço/L" value={formatBRL(receipt.price)} />
        <div className="my-1 border-t border-dashed border-[color:var(--color-border)]" />
        <Row label="Total" value={formatBRL(receipt.amount)} strong />
        <Row label="Data" value={receipt.at} />
      </div>

      <button onClick={onNew} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-xs text-white">
        <Receipt className="h-3.5 w-3.5" />
        Nova transação
      </button>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className={strong ? "font-mono font-semibold text-white" : "font-mono text-white"}>{value}</span>
    </div>
  );
}
