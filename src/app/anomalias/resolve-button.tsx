"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onResolve() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("anomalies")
      .update({ resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", id);
    if (error) {
      alert("Falha ao resolver: " + error.message);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <Button size="sm" onClick={onResolve} disabled={loading}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {loading ? "Resolvendo…" : "Marcar como resolvido"}
    </Button>
  );
}
