// Petit service worker - production only
// In dev mode, this unregisters itself to prevent stale caching

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // If not on a production build, unregister and clear caches
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clients) => {
      const isDev = clients.some((c) => c.url.includes("localhost"))
      if (isDev) {
        return caches.keys().then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        ).then(() => self.registration.unregister())
      }

      // Production: clean old caches
      const CACHE_NAME = "petit-docs-v1"
      return caches.keys().then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        )
      )
    })
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  // Only cache in production
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
