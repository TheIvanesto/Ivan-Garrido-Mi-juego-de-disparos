const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// Lista de archivos que queremos cachear durante la instalación
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/game.css',
  '/main.js',
  '/Game.js',
  '/Entity.js',
  '/Character.js',
  '/Player.js',
  '/Opponent.js',
  '/Shot.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/bueno.png',
  '/assets/malo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Manejar navegación: intentar red (network-first), fallback a cache y offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Para recursos estáticos: cache-first, y actualizar runtime cache en segundo plano
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME).then((cache) => {
        return fetch(event.request).then((response) => {
          // Solo cachear respuestas válidas y same-origin
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            try { cache.put(event.request, response.clone()); } catch (e) { /* ignore */ }
          }
          return response;
        }).catch(() => {
          // Si la petición falla y es una imagen, se podría devolver un placeholder opcional
          return new Response('');
        });
      });
    })
  );
});

// Permitir control de actualizaciones desde la página
self.addEventListener('message', (evt) => {
  if (!evt.data) return;
  if (evt.data === 'SKIP_WAITING' || (evt.data && evt.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});
