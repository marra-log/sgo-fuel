"use client";

import { useState } from "react";
import { Cpu, CreditCard, Power, Wifi } from "lucide-react";
import { FuelTerminal, type TermCard, type TermPump } from "@/components/terminal/fuel-terminal";

type Mode = "card" | "ia";

/**
 * Tela do Totem IoT. Dois modos validados:
 *  - "card": terminal private label fechado (lê cartão/NFC, valida e DEBITA o saldo).
 *  - "ia":   fluxo original por câmera/ALPR (libera a bomba pela cota da rota).
 */
export function TotemTerminal({ pumps, cards }: { pumps: TermPump[]; cards: TermCard[] }) {
  const [mode, setMode] = useState<Mode>("card");

  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">
          <Cpu className="h-3.5 w-3.5 text-[color:var(--color-brand)]" /> Aether IA · v2.4
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[color:var(--color-muted)]">
          <Wifi className="h-3 w-3" /> 4G
        </div>
      </div>

      {/* Toggle de modo */}
      <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-1">
        <button
          onClick={() => setMode("card")}
          className={
            "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors " +
            (mode === "card" ? "bg-[color:var(--color-brand)] text-black" : "text-[color:var(--color-muted)]")
          }
        >
          <CreditCard className="h-3.5 w-3.5" /> Cartão / NFC
        </button>
        <button
          onClick={() => setMode("ia")}
          className={
            "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors " +
            (mode === "ia" ? "bg-[color:var(--color-brand)] text-black" : "text-[color:var(--color-muted)]")
          }
        >
          <Cpu className="h-3.5 w-3.5" /> IA / Placa
        </button>
      </div>

      <div className="max-h-[560px] overflow-y-auto rounded-[18px] bg-black p-4">
        {mode === "card" ? (
          <FuelTerminal pumps={pumps} cards={cards} title="Abastecer com cartão" />
        ) : (
          <IaMockup />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-[10px] text-[color:var(--color-muted)]">
        <span>SGO-Fuel · Totem v2</span>
        <span>S/N · SGOF-TC-0014</span>
      </div>
    </div>
  );
}

/** Showcase original: câmera + ALPR + bomba liberada (modo IA). */
function IaMockup() {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">Câmera frontal</div>
      <div className="relative mt-2 aspect-video overflow-hidden rounded bg-black">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-25">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border-r border-b border-white/10" />
          ))}
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-[color:var(--color-brand)] px-2 py-1">
          <div className="text-[8px] uppercase tracking-wider text-[color:var(--color-brand)]">Placa</div>
          <div className="font-mono text-xs text-[color:var(--color-text-strong)]">RDA-1A01</div>
        </div>
        <div className="absolute inset-x-0 h-8 scanline" />
      </div>

      <div className="mt-3 space-y-1.5 text-[11px]">
        <Row label="Motorista" value="João P." ok />
        <Row label="Cota autorizada" value="180 L" ok />
        <Row label="Rota" value="RTA-1184 · BH→Vitória" ok />
        <Row label="Recipiente" value="Padrão OK" ok />
      </div>

      <div className="mt-4 rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-[color:var(--color-brand)]">
          <Power className="h-4 w-4" />
          <span className="text-sm font-semibold">BOMBA LIBERADA</span>
        </div>
        <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">SSR energizado · IA monitorando bico</div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className={ok ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-text-strong)]"}>{value}</span>
    </div>
  );
}
