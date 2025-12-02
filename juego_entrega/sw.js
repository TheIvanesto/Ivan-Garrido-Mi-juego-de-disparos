const CACHE_NAME = 'shooter-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'Game.js',
  'Entity.js',
  'Character.js',
  'Player.js',
  'Opponent.js',
  'Shot.js',
  'main.js',
  'game.css',
  'assets/bueno.png',
  'assets/bueno_muerto.png',
  'assets/malo.png',
  'assets/malo_muerto.png',
  'assets/shot1.png',
  'assets/shot2.png',
  'assets/game_over.png',
  'offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  ).then(() => self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // For navigation requests, try network first, then cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // stale-while-revalidate for cached resources
          fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
            }
          }).catch(() => {});
          return response;
        }
        return fetch(request).then(networkResponse => {
          // put in cache for future
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        }).catch(() => {
          // as last resort, try offline page for navigation handled earlier
          return caches.match('offline.html');
        });
      })
  );
});
