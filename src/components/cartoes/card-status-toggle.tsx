"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Unlock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const TONE: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  BLOCKED: "warning",
  LOST: "danger",
};
const LABEL: Record<string, string> = { ACTIVE: "Ativo", BLOCKED: "Bloqueado", LOST: "Perdido" };

/**
 * Mostra o status do cartão e permite bloquear/desbloquear na hora.
 * Cartão LOST (perdido) não é alternável aqui — usa a edição.
 */
export function CardStatusToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(status);

  const canToggle = current === "ACTIVE" || current === "BLOCKED";
  const next = current === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  async function toggle() {
    if (!canToggle || busy) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("fleet_cards").update({ status: next }).eq("id", id);
    setBusy(false);
    if (!error) {
      setCurrent(next);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Badge variant={TONE[current] ?? "warning"}>{LABEL[current] ?? current}</Badge>
      {canToggle ? (
        <button
          onClick={toggle}
          disabled={busy}
          title={current === "ACTIVE" ? "Bloquear cartão" : "Desbloquear cartão"}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] hover:text-[color:var(--color-text-strong)] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : current === "ACTIVE" ? (
            <Ban className="h-3.5 w-3.5" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
    </div>
  );
}
