const PRECACHE = 'precache-v2';
const RUNTIME = 'runtime';

// Derivar base según el scope del worker (soporta /juego_entrega/)
const SCOPE = (self.registration && self.registration.scope) ? self.registration.scope : '/juego_entrega/';
const BASE = new URL('.', SCOPE).pathname;

// Lista de archivos relativos al scope del service worker
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'offline.html',
  BASE + 'game.css',
  BASE + 'main.js',
  BASE + 'Game.js',
  BASE + 'Character.js',
  BASE + 'Entity.js',
  BASE + 'Player.js',
  BASE + 'Opponent.js',
  BASE + 'Shot.js',
  BASE + 'manifest.json',
  BASE + 'icons/icon.svg',
  BASE + 'assets/bueno.svg',
  BASE + 'assets/bueno_muerto.svg',
  BASE + 'assets/malo.svg',
  BASE + 'assets/malo_muerto.svg',
  BASE + 'assets/game_over.svg',
  BASE + 'assets/jefe.svg',
  BASE + 'assets/jefe_muerto.svg',
  BASE + 'assets/shot1.svg',
  BASE + 'assets/shot2.svg',
  BASE + 'assets/you_win.svg',
  BASE + 'assets/screenshot.svg',
  BASE + 'assets/clases.svg'
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
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!currentCaches.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => response).catch(() => caches.match(BASE + 'offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return caches.open(RUNTIME).then(cache => {
        return fetch(event.request).then(response => {
          try {
            if (event.request.url.startsWith(self.location.origin) && response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
          } catch (e) {}
          return response;
        }).catch(() => {
          return new Response('', {status: 404, statusText: 'Not Found'});
        });
      });
    })
  );
});

self.addEventListener('message', (evt) => {
  if (!evt.data) return;
  if (evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
