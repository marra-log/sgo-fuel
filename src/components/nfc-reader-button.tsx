"use client";

import { useEffect, useRef, useState } from "react";
import { Nfc, Loader2 } from "lucide-react";
import { isWebNfcSupported, scanNfcOnce, type NfcScan } from "@/lib/web-nfc";

/**
 * Botão que lê uma tag NFC física (Web NFC, Chrome Android) e devolve o UID.
 * Em aparelhos sem suporte, fica desabilitado com dica — o fluxo manual continua valendo.
 */
export function NfcReaderButton({
  onRead,
  label = "Aproximar cartão (NFC)",
  className = "",
}: {
  onRead: (uid: string) => void;
  label?: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const scanRef = useRef<NfcScan | null>(null);

  useEffect(() => {
    setSupported(isWebNfcSupported());
    return () => scanRef.current?.stop();
  }, []);

  async function start() {
    setMsg(null);
    setScanning(true);
    scanRef.current = await scanNfcOnce(
      (uid) => {
        onRead(uid);
        setScanning(false);
        setMsg(`Tag lida: ${uid}`);
      },
      (err) => {
        setMsg(err);
        setScanning(false);
      }
    );
  }

  if (!supported) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          title="Disponível no Chrome para Android com NFC. Em desktop/iOS, use o modo manual."
          className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs text-[color:var(--color-muted)] opacity-70"
        >
          <Nfc className="h-3.5 w-3.5" />
          NFC indisponível (use Android)
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={scanning}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--color-brand)]/50 bg-[color:var(--color-brand-soft)] px-3 py-2 text-xs font-medium text-[color:var(--color-brand)] disabled:opacity-70"
      >
        {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Nfc className="h-3.5 w-3.5" />}
        {scanning ? "Aproxime a tag…" : label}
      </button>
      {msg ? <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">{msg}</div> : null}
    </div>
  );
}
