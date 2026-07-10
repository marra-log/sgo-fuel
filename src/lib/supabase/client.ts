"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * fetch com timeout: nenhuma chamada ao Supabase fica pendente para sempre.
 * Protege contra extensões de navegador que interceptam/quebram requisições
 * (sintoma: telas presas em "Salvando…"/"Carregando…" sem erro no console).
 */
function fetchComTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new DOMException(
        "A requisição não retornou em 15s — provavelmente uma extensão do navegador está bloqueando. Teste em janela anônima e desative extensões.",
        "TimeoutError"
      )
    );
  }, 15000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchComTimeout },
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
