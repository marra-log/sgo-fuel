"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Lock "pass-through": evita que getUser()/getSession() fiquem pendentes
        // esperando o Web Locks API quando há várias abas abertas (causa de telas
        // presas em "Carregando…"). Aceita o pequeno risco de corrida no refresh.
        lock: function <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
          return fn();
        },
      },
    }
  );
}
