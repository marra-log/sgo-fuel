"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Kill switch: remove qualquer service worker antigo (que poderia servir um
    // bundle desatualizado) e limpa os caches dele. O "Adicionar à tela inicial"
    // continua funcionando pelo manifest, sem depender do SW.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);

  return null;
}
