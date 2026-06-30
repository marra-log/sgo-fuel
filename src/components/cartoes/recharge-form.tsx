"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Plus, QrCode } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PixCharge } from "@/components/pix-charge";
import { formatBRL } from "@/lib/utils";

const PRESETS = [200, 500, 1000, 2000];

export function RechargeForm({ cardId, initialBalance }: { cardId: string; initialBalance: number }) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [amount, setAmount] = useState<string>("500");
  const [method, setMethod] = useState("MANUAL");
  const [note, setNote] = useState("");
  const [showPix, setShowPix] = useState(false);
  const [pixTxid, setPixTxid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Gera o QR PIX e registra a cobrança PENDENTE (o webhook credita ao confirmar)
  async function gerarPix() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setMsg({ kind: "err", text: "Informe um valor válido antes de gerar o PIX." });
      return;
    }
    const txid = `SGO${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setPixTxid(txid);
    setShowPix(true);
    // best-effort: se pix.sql não estiver aplicado, segue só com o QR manual
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.rpc("fn_create_pix_charge", { p_card_id: cardId, p_amount: value, p_txid: txid, p_provider: "manual" });
    } catch {
      /* estrutura PIX automática ainda não habilitada — ok */
    }
  }

  async function recarregar() {
    setBusy(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();
    try {
      const value = Number(amount);
      if (!value || value <= 0) {
        setMsg({ kind: "err", text: "Informe um valor de recarga válido." });
        return;
      }
      const { data, error } = await supabase.rpc("fn_recharge_card", {
        p_card_id: cardId,
        p_amount: value,
        p_method: method,
        p_note: note || null,
      });
      if (error) {
        const hint = /does not exist|schema cache|function/i.test(error.message)
          ? "Rode supabase/wallet.sql no Supabase para habilitar a carteira."
          : error.message;
        setMsg({ kind: "err", text: hint });
        return;
      }
      const novo = Number(data);
      setBalance(novo);
      setShowPix(false);
      setMsg({ kind: "ok", text: `Saldo recarregado. Novo saldo: ${formatBRL(novo)}.` });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: "Erro inesperado: " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
          <Wallet className="h-4 w-4 text-[color:var(--color-brand)]" /> Saldo do cartão
        </h3>
      </div>
      <div className="mt-2 text-3xl font-semibold text-[color:var(--color-brand)]">{formatBRL(balance)}</div>
      <p className="text-xs text-[color:var(--color-muted)]">disponível para abastecer na Smart POS</p>

      <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
        <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Adicionar saldo (R$)</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={
                "rounded-md border px-2.5 py-1.5 text-xs transition-colors " +
                (Number(amount) === p
                  ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]")
              }
            >
              {formatBRL(p)}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Valor</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 font-mono text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Forma</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)]"
            >
              <option value="MANUAL">Lançamento manual</option>
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto</option>
              <option value="TED">TED / Transferência</option>
            </select>
          </label>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Observação (opcional) — ex.: depósito da transportadora"
          className="mt-2 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs text-[color:var(--color-text-strong)] outline-none focus:border-[color:var(--color-brand)] placeholder:text-[color:var(--color-muted)]"
        />

        {method === "PIX" ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => (showPix ? setShowPix(false) : gerarPix())}
              className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-brand)] hover:underline"
            >
              <QrCode className="h-3.5 w-3.5" /> {showPix ? "Ocultar QR PIX" : "Gerar QR PIX para o cliente pagar"}
            </button>
            {showPix && pixTxid && Number(amount) > 0 ? (
              <div className="mt-2">
                <PixCharge valor={Number(amount)} txid={pixTxid} />
                <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                  Com o PSP conectado (Asaas/Efí), o saldo é creditado <b>automaticamente</b> ao confirmar o PIX.
                  Sem PSP, clique em <b>Confirmar recarga</b> quando o dinheiro cair.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={recarregar}
          disabled={busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[color:var(--color-brand)] py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {busy ? "Creditando…" : method === "PIX" ? "Confirmar recarga" : "Adicionar saldo"}
        </button>

        {msg ? (
          <p
            className={
              "mt-2 rounded-md px-3 py-2 text-xs " +
              (msg.kind === "ok"
                ? "border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                : "border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]")
            }
          >
            {msg.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
