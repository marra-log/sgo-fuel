"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Nfc, Printer, Receipt as ReceiptIcon, Wallet, XCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { NfcReaderButton } from "@/components/nfc-reader-button";
import { normalizeUid } from "@/lib/web-nfc";
import { formatBRL, formatNumber } from "@/lib/utils";

export type TermPump = {
  id: string;
  serial_number: string;
  yards: { name: string } | null;
  partner_station: string | null;
};
export type TermCard = { card_number: string; holder_name: string | null; status: string };

type Receipt = {
  ok: boolean;
  reason?: string;
  card: string;
  holder?: string | null;
  liters: number;
  price: number;
  amount: number;
  at: string;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  txId?: string | null;
};

type AuthResult = {
  ok: boolean;
  reason?: string;
  tx_id?: string;
  holder?: string | null;
  amount?: number;
  balance_before?: number | null;
  balance_after?: number | null;
};

/**
 * Tela funcional do terminal de abastecimento (private label fechado).
 * Lê o cartão (NFC ou número), valida status/PIN/SALDO no servidor e
 * DEBITA a carteira de forma atômica via fn_authorize_card. Usado tanto
 * na Smart POS quanto no Totem IoT — a "carcaça" fica em cada página.
 */
export function FuelTerminal({
  pumps,
  cards,
  title = "SGO-Fuel · Terminal",
}: {
  pumps: TermPump[];
  cards: TermCard[];
  title?: string;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [liters, setLiters] = useState("100");
  const [price, setPrice] = useState("6.12");
  const [pumpId, setPumpId] = useState(pumps[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [nfcInfo, setNfcInfo] = useState<string | null>(null);

  async function onNfcRead(uid: string) {
    setNfcInfo(null);
    const supabase = createSupabaseBrowserClient();
    const { data: card } = await supabase
      .from("fleet_cards")
      .select("card_number, holder_name")
      .eq("nfc_uid", normalizeUid(uid))
      .maybeSingle();
    if (card) {
      setCardNumber(card.card_number);
      setNfcInfo(`Cartão reconhecido: ${card.holder_name ?? card.card_number.slice(-4)}`);
    } else {
      setNfcInfo(`Tag não cadastrada (UID ${uid}). Cadastre em /cartoes.`);
    }
  }

  async function autorizar() {
    setBusy(true);
    setReceipt(null);
    const supabase = createSupabaseBrowserClient();

    const litersN = Number(liters || 0);
    const priceN = Number(price || 0);
    const clean = cardNumber.replace(/\s/g, "");

    try {
      const { data, error } = await supabase.rpc("fn_authorize_card", {
        p_card_number: clean,
        p_pin: pin || null,
        p_liters: litersN,
        p_price: priceN,
        p_pump_id: pumpId || null,
      });

      if (error) {
        const reason = /does not exist|schema cache|function/i.test(error.message)
          ? "Carteira não habilitada — rode supabase/wallet.sql no Supabase."
          : error.message;
        setReceipt(makeReceipt({ ok: false, reason }, clean, litersN, priceN));
        return;
      }

      setReceipt(
        makeReceipt((data ?? { ok: false, reason: "Sem resposta do terminal." }) as AuthResult, clean, litersN, priceN)
      );
    } catch (e) {
      setReceipt(
        makeReceipt({ ok: false, reason: "Erro: " + (e instanceof Error ? e.message : String(e)) }, clean, litersN, priceN)
      );
    } finally {
      setBusy(false);
    }
  }

  function makeReceipt(r: AuthResult, card: string, litersN: number, priceN: number): Receipt {
    return {
      ok: r.ok,
      reason: r.ok ? undefined : r.reason,
      card: card.length > 4 ? `•••• ${card.slice(-4)}` : card,
      holder: r.holder ?? null,
      liters: litersN,
      price: priceN,
      amount: r.amount ?? Math.round(litersN * priceN * 100) / 100,
      at: new Date().toLocaleString("pt-BR"),
      balanceBefore: r.balance_before ?? null,
      balanceAfter: r.balance_after ?? null,
      txId: r.tx_id ?? null,
    };
  }

  if (receipt) {
    return <ReceiptView receipt={receipt} onNew={() => { setReceipt(null); setPin(""); }} />;
  }

  return (
    <>
      <div className="flex items-center gap-2 text-[color:var(--color-text-strong)]">
        <CreditCard className="h-4 w-4 text-[color:var(--color-brand)]" />
        <span className="text-sm font-semibold">{title}</span>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Número do cartão ou aproxime a tag
        </span>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="7000 0000 0000 0000"
          className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5 font-mono text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]"
        />
      </label>

      <div className="mt-2">
        <NfcReaderButton onRead={onNfcRead} />
        {nfcInfo ? <div className="mt-1 text-[11px] text-[color:var(--color-brand)]">{nfcInfo}</div> : null}
        <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
          Teste no Android (Chrome) com qualquer tag NFC. Ele mostra o UID lido.
        </p>
      </div>

      {cards.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cards.slice(0, 4).map((c) => (
            <button
              key={c.card_number}
              onClick={() => setCardNumber(c.card_number)}
              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]"
              title={c.holder_name ?? ""}
            >
              <Nfc className="h-3 w-3" />•{c.card_number.slice(-4)}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-[color:var(--color-warning)]">Nenhum cartão emitido. Emita em /cartoes.</p>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Litros</span>
          <input value={liters} onChange={(e) => setLiters(e.target.value)} type="number" min={0}
            className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">R$/L</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} step="0.01"
            className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">PIN</span>
          <input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} inputMode="numeric"
            className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-2 font-mono text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]" placeholder="••••" />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Bomba</span>
        <select value={pumpId} onChange={(e) => setPumpId(e.target.value)}
          className="w-full appearance-none rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]">
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
        <span className="font-mono text-lg font-semibold text-[color:var(--color-text-strong)]">
          {formatBRL((Number(liters) || 0) * (Number(price) || 0))}
        </span>
      </div>

      <button
        onClick={autorizar}
        disabled={busy || !cardNumber}
        className="mt-4 w-full rounded-xl bg-[color:var(--color-brand)] py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Processando…" : "Autorizar e debitar"}
      </button>
    </>
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
        <Row label="Comprovante" value={receipt.txId ? receipt.txId.slice(0, 8).toUpperCase() : "—"} />
        <Row label="Cartão" value={receipt.card} />
        {receipt.holder ? <Row label="Titular" value={receipt.holder} /> : null}
        <Row label="Litros" value={`${formatNumber(receipt.liters)} L`} />
        <Row label="Preço/L" value={formatBRL(receipt.price)} />
        <div className="my-1 border-t border-dashed border-[color:var(--color-border)]" />
        <Row label="Valor debitado" value={formatBRL(receipt.amount)} strong />
        <Row label="Data" value={receipt.at} />
      </div>

      {receipt.ok && receipt.balanceAfter != null ? (
        <div className="mt-3 rounded-lg border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] p-3 text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--color-brand)]">
            <Wallet className="h-3.5 w-3.5" /> Carteira do cartão
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {receipt.balanceBefore != null ? <Row label="Saldo anterior" value={formatBRL(receipt.balanceBefore)} /> : null}
            <Row label="Saldo atual" value={formatBRL(receipt.balanceAfter)} strong />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-2">
        {receipt.ok ? (
          <button onClick={() => printReceipt(receipt)} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>
        ) : null}
        <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-2)]">
          <ReceiptIcon className="h-3.5 w-3.5" />
          Nova transação
        </button>
      </div>
    </div>
  );
}

/** Imprime o comprovante (no navegador da POS/Totem). A impressão térmica
 *  via bobina é a fase APK (SDK Sunmi/PAX). */
function printReceipt(r: Receipt) {
  if (typeof window === "undefined") return;
  const linha = (label: string, value: string, big = false) =>
    `<div class="row${big ? " big" : ""}"><span>${label}</span><span>${value}</span></div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Comprovante</title>
  <style>
    *{font-family:ui-monospace,Menlo,Consolas,monospace}
    body{width:280px;margin:0 auto;padding:12px;color:#000}
    h1{font-size:13px;text-align:center;margin:0 0 6px}
    .center{text-align:center}
    .row{display:flex;justify-content:space-between;font-size:12px;margin:2px 0}
    .big{font-size:15px;font-weight:bold}
    .hr{border-top:1px dashed #000;margin:8px 0}
  </style></head>
  <body onload="window.print();setTimeout(function(){window.close()},300)">
    <h1>SGO-Fuel · Comprovante</h1>
    <div class="center" style="font-size:13px;font-weight:bold">${r.ok ? "APROVADO" : "NEGADO"}</div>
    <div class="hr"></div>
    ${linha("Comprovante", r.txId ? r.txId.slice(0, 8).toUpperCase() : "—")}
    ${linha("Cartão", r.card)}
    ${r.holder ? linha("Titular", r.holder) : ""}
    ${linha("Litros", `${formatNumber(r.liters)} L`)}
    ${linha("Preço/L", formatBRL(r.price))}
    <div class="hr"></div>
    ${linha("Debitado", formatBRL(r.amount), true)}
    ${r.balanceAfter != null ? linha("Saldo atual", formatBRL(r.balanceAfter)) : ""}
    ${linha("Data", r.at)}
    <div class="hr"></div>
    <div class="center" style="font-size:10px">Obrigado! · SGO-Fuel</div>
  </body></html>`;
  const w = window.open("", "_blank", "width=320,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className={strong ? "font-mono font-semibold text-[color:var(--color-text-strong)]" : "font-mono text-[color:var(--color-text-strong)]"}>{value}</span>
    </div>
  );
}
