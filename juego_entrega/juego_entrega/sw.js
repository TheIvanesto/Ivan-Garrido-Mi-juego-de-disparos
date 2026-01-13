const PRECACHE = 'precache-v2';
const RUNTIME = 'runtime';

// Archivos que queremos cachear inicialmente
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './game.css',
  './main.js',
  './Game.js',
  './Character.js',
  './Entity.js',
  './Player.js',
  './Opponent.js',
  './Shot.js',
  './manifest.json',
  './icons/icon.svg',
  './assets/bueno.svg',
  './assets/bueno_muerto.svg',
  './assets/malo.svg',
  './assets/malo_muerto.svg',
  './assets/game_over.svg',
  './assets/jefe.svg',
  './assets/jefe_muerto.svg',
  './assets/shot1.svg',
  './assets/shot2.svg',
  './assets/you_win.svg',
  './assets/screenshot.svg',
  './assets/clases.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
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
  // Navegación -> intentar red en primer lugar, fallback al cache y luego a offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        return response;
      }).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Para imágenes y otros recursos estáticos, usar cache-first
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME).then(cache => {
        return fetch(event.request).then(response => {
          // No cacheamos las peticiones cross-origin inseguras
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Si falla la petición y es imagen, podemos devolver un placeholder si lo tuviéramos
          return new Response('');
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
