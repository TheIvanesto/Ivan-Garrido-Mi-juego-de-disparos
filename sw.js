const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// Construir base según el scope del service worker: funcionará tanto en / como en /juego_entrega/
const SCOPE = (self.registration && self.registration.scope) ? self.registration.scope : '/';
const BASE = new URL('.', SCOPE).pathname; // '/juego_entrega/' o '/'

// Lista relativa: la mayoría son rutas relativas al scope del SW
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'offline.html',
  BASE + 'game.css',
  BASE + 'main.js',
  BASE + 'Game.js',
  BASE + 'Entity.js',
  BASE + 'Character.js',
  BASE + 'Player.js',
  BASE + 'Opponent.js',
  BASE + 'Shot.js',
  BASE + 'manifest.json',
  BASE + 'icons/icon.svg',
  BASE + 'icons/icon-192x192.png',
  BASE + 'icons/icon-512x512.png',
  BASE + 'assets/bueno.png',
  BASE + 'assets/malo.png'
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
  // Navegación: network-first con fallback al index del scope y offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(BASE + 'index.html').then((r) => r || caches.match(BASE + 'offline.html')))
    );
    return;
  }

  // Recursos estáticos: cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return caches.open(RUNTIME).then((cache) => {
        return fetch(event.request).then((response) => {
          // Cachear solo respuestas válidas y same-origin
          try {
            if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, response.clone());
            }
          } catch (e) { /* ignore */ }
          return response;
        }).catch(() => {
          // En caso de fallo, devolver un fallback vacío para evitar servir HTML en lugar de imagen
          return new Response('', {status: 404, statusText: 'Not Found'});
        });
      });
    })
  );
});

// Soporta activación desde la página
self.addEventListener('message', (evt) => {
  if (!evt.data) return;
  if (evt.data === 'SKIP_WAITING' || (evt.data && evt.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});
