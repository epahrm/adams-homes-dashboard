/* Wander service worker — makes the planner work offline once visited.
   Bump VERSION whenever any file in /travel changes so clients pick it up. */
const VERSION = "porter-v7";
const ASSETS = [
  "/travel/",
  "/travel/index.html",
  "/travel/manifest.webmanifest",
  "/travel/icon.svg",
  "/travel/icon-180.png",
  "/travel/icon-192.png",
  "/travel/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/travel")) return;

  // The page itself: network-first so updates land, cache fallback for offline.
  if (e.request.mode === "navigate" || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/travel/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/travel/index.html"))
    );
    return;
  }

  // Static assets: cache-first.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
