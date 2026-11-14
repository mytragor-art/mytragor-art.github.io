
const CACHE_PREFIX = 'mytragor-calculadora-';
const CACHE = `${CACHE_PREFIX}5981fbd-install-v1`;
const ASSETS = [
  './',
  './index.html',
  './data/chosen.js',
  './data/allies.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.registration.scope)) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(e.request);
        if (response.ok && ASSETS.some(asset => new URL(asset, self.registration.scope).href === e.request.url)) {
          await cache.put(e.request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        console.error('Recurso da calculadora indisponível offline.', e.request.url, error);
        throw error;
      }
    })()
  );
});
