// Service Worker with precache and runtime cache strategies
const PRECACHE = 'precache-v2';
const RUNTIME = 'runtime';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './game.css',
  './main.js',
  './Game.js',
  './Entity.js',
  './Character.js',
  './Player.js',
  './Opponent.js',
  './Shot.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './assets/bueno.png',
  './assets/malo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Navigation requests: network-first, fallback to cache then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If we got a valid response, update the cache
          const copy = response.clone();
          caches.open(RUNTIME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./offline.html')))
    );
    return;
  }

  // For images: cache-first
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          return caches.match('./icons/icon-192x192.png');
        });
      })
    );
    return;
  }

  // For other requests: cache-first then network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(RUNTIME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // fallback for documents
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html').then(r => r || caches.match('./offline.html'));
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
