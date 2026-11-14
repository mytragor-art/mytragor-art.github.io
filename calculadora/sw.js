
const CACHE_PREFIX = 'mytragor-calculadora-';
const CACHE = `${CACHE_PREFIX}v1`;
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
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.registration.scope)) return;
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
