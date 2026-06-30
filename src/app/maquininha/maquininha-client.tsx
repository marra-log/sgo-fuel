"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FuelTerminal, type TermCard, type TermPump } from "@/components/terminal/fuel-terminal";

export function MaquininhaClient({ pumps, cards }: { pumps: TermPump[]; cards: TermCard[] }) {
  return (
    <div className="grid-backdrop min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/cartoes" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)]">
          <ArrowLeft className="h-3 w-3" /> Cartões de frota
        </Link>

        {/* Carcaça do terminal Smart POS */}
        <div className="mt-3 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[0_30px_60px_-20px_rgba(25,195,125,0.25)]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">SGO-Fuel POS · A920</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[color:var(--color-brand)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-brand)]" /> online
            </span>
          </div>

          <div className="mt-2 rounded-[18px] bg-black p-4">
            <FuelTerminal pumps={pumps} cards={cards} title="Autorizar abastecimento" />
          </div>

          <div className="mt-3 px-1 text-center text-[10px] text-[color:var(--color-muted)]">
            Terminal Smart POS · valida saldo, status e PIN e debita a carteira do cartão
          </div>
        </div>
      </div>
    </div>
  );
}
