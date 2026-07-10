"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vigia de versão: compara a versão publicada com a que está rodando na aba.
 * Quando sai um deploy novo, a aba antiga se atualiza sozinha (ou com 1 clique
 * se o usuário estiver digitando). Elimina o problema de "aba com código velho".
 */
export function UpdateWatchdog() {
  const base = useRef<string | null>(null);
  const [novaVersao, setNovaVersao] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function check(auto: boolean) {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { v: string };
        if (!ativo) return;
        if (base.current === null) {
          base.current = j.v;
          return;
        }
        if (j.v !== base.current) {
          // Nova versão publicada. Se o usuário não está no meio de digitação,
          // recarrega sozinho; senão mostra o aviso com botão.
          const digitando =
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement;
          if (auto && !digitando) {
            window.location.reload();
          } else {
            setNovaVersao(true);
          }
        }
      } catch {
        /* offline/bloqueado — tenta de novo depois */
      }
    }

    check(false);
    const id = setInterval(() => check(false), 3 * 60 * 1000);
    const onFocus = () => check(true);
    window.addEventListener("focus", onFocus);
    return () => {
      ativo = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!novaVersao) return null;

  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-xs font-semibold text-black shadow-lg"
    >
      Nova versão disponível — clique para atualizar
    </button>
  );
}
