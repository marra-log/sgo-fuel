// SGO-Fuel · Service Worker (Bloco A6)
// Cache leve do shell da PWA do motorista. Estratégia: network-first com
// fallback pro cache (offline básico). Dados sensíveis não são cacheados.

const CACHE = "sgo-fuel-v1";
const SHELL = ["/app", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Só GET e mesma origem; nunca cacheia chamadas ao Supabase.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/app")))
  );
});
