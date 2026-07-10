"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Transporte resiliente para as chamadas ao Supabase.
 *
 * Problema real observado: extensões de navegador quebradas interceptam o
 * window.fetch e deixam requisições pendentes para sempre (telas presas em
 * "Salvando…"). Defesa em duas camadas:
 *  1. fetch nativo com timeout de 12s — nunca fica pendurado;
 *  2. se o fetch falhar/estourar, refaz via XMLHttpRequest (extensões que
 *     quebram o fetch quase nunca interceptam XHR) e passa a preferir XHR
 *     na sessão.
 */
let preferirXhr = false;

function xhrFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 20000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = (init?.method ?? "GET").toUpperCase();
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = timeoutMs;
    try {
      new Headers(init?.headers).forEach((v, k) => {
        try {
          xhr.setRequestHeader(k, v);
        } catch {
          /* header proibido — ignora */
        }
      });
    } catch {
      /* sem headers */
    }
    xhr.onload = () => {
      const headers = new Headers();
      xhr
        .getAllResponseHeaders()
        .trim()
        .split(/[\r\n]+/)
        .forEach((line) => {
          const i = line.indexOf(":");
          if (i > 0) {
            try {
              headers.append(line.slice(0, i).trim(), line.slice(i + 1).trim());
            } catch {
              /* ignora header inválido */
            }
          }
        });
      const status = xhr.status || 200;
      const body = status === 204 || status === 205 || status === 304 ? null : xhr.responseText;
      resolve(new Response(body, { status, statusText: xhr.statusText, headers }));
    };
    xhr.onerror = () => reject(new TypeError("Falha de rede (XHR)"));
    xhr.ontimeout = () =>
      reject(new DOMException("A requisição não retornou (XHR). Verifique sua conexão.", "TimeoutError"));
    xhr.send((init?.body as XMLHttpRequestBodyInit | undefined) ?? null);
  });
}

async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!preferirXhr) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException("fetch interceptado/lento", "TimeoutError")),
      12000
    );
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch {
      // fetch quebrado (extensão) ou estourou: daqui em diante usa XHR direto.
      preferirXhr = true;
    } finally {
      clearTimeout(timer);
    }
  }
  return xhrFetch(input, init);
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: resilientFetch },
      auth: {
        // Lock "pass-through": evita que getUser()/getSession() fiquem pendentes
        // esperando o Web Locks API quando há várias abas abertas.
        lock: function <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
          return fn();
        },
      },
    }
  );
}
