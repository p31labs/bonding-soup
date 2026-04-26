const CACHE_NAME = 'p31-error-pages-v1';
const ERROR_PAGES = ['/404', '/500', '/offline', '/maintenance'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ERROR_PAGES))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (ERROR_PAGES.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          fetch(request)
            .then((response) => cache.put(request, response.clone()))
            .catch(() => {});
          return cached;
        }
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }
});
