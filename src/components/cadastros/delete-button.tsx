"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  table,
  id,
  redirectTo,
  label = "Excluir",
}: {
  table: string;
  id: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onConfirm() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert("Falha ao excluir: " + error.message);
      setLoading(false);
      setConfirmOpen(false);
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  if (!confirmOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-2 py-1">
      <span className="text-xs text-[color:var(--color-danger)]">Confirmar?</span>
      <Button type="button" size="sm" variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? "…" : "Sim"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmOpen(false)} disabled={loading}>
        Não
      </Button>
    </div>
  );
}
