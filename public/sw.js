// SGO-Fuel · Service Worker — KILL SWITCH
// Substitui o SW antigo (que cacheava o shell). Este apenas se auto-remove,
// limpa caches e recarrega as abas para garantir que ninguém fique preso em
// código desatualizado. Sem cache de código durante o desenvolvimento.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        /* ignore */
      }
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (e) {
          /* ignore */
        }
      });
    })()
  );
});

// Nunca intercepta requisições — tudo vai direto para a rede.
