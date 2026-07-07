"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionInfo = {
  email: string;
  tenantName: string | null;
} | null;

export function UserMenu() {
  const [session, setSession] = useState<SessionInfo>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      try {
        // getSession lê da storage local (rápido) — o menu/logout aparece na hora.
        const { data: { session: s } } = await supabase.auth.getSession();
        const user = s?.user;
        if (!user) {
          if (!cancelled) setSession(null);
          return;
        }
        if (!cancelled) setSession({ email: user.email ?? "", tenantName: null });
        // Enriquece o nome da empresa depois, sem travar o logout.
        const { data: members } = await supabase
          .from("tenant_members")
          .select("tenants(name)")
          .limit(1)
          .maybeSingle();
        if (!cancelled) {
          const tenantName = (members?.tenants as unknown as { name?: string } | null)?.name ?? null;
          setSession((prev) => (prev ? { ...prev, tenantName } : { email: user.email ?? "", tenantName }));
        }
      } catch {
        /* não bloqueia o menu/logout se a consulta falhar */
      }
    }
    load();

    const sub = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!session) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 text-xs text-[color:var(--color-text-strong)] transition-colors hover:bg-[color:var(--color-surface-2)]"
        aria-label="Menu do usuário"
      >
        <UserIcon className="h-3.5 w-3.5" />
        <span className="hidden max-w-[160px] truncate sm:inline">
          {session.tenantName ?? session.email}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-xl">
          <div className="border-b border-[color:var(--color-border)] px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
              Empresa
            </div>
            <div className="mt-0.5 text-sm font-medium text-[color:var(--color-text-strong)]">
              {session.tenantName ?? "—"}
            </div>
            <div className="mt-2 truncate text-xs text-[color:var(--color-muted)]">
              {session.email}
            </div>
          </div>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
