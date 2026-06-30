"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SALDO_BAIXO = 100;

/** Sino do header: conta alertas (bloqueados + saldo baixo + negadas 48h). */
export function AlertsBell() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const [blocked, low, declined] = await Promise.all([
          supabase.from("fleet_cards").select("*", { count: "exact", head: true }).in("status", ["BLOCKED", "LOST"]),
          supabase.from("fleet_cards").select("*", { count: "exact", head: true }).eq("status", "ACTIVE").lt("balance_brl", SALDO_BAIXO),
          supabase.from("card_transactions").select("*", { count: "exact", head: true }).eq("status", "DECLINED").gte("created_at", since),
        ]);
        if (cancel) return;
        const total = (blocked.count ?? 0) + (low.error ? 0 : low.count ?? 0) + (declined.count ?? 0);
        setCount(total);
      } catch {
        /* silencioso: sino só não mostra contagem */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pathname]);

  return (
    <Link
      href="/alertas"
      aria-label={`Alertas${count ? ` (${count})` : ""}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-strong)] transition-colors hover:bg-[color:var(--color-surface-2)]"
    >
      <Bell className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-danger)] px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
