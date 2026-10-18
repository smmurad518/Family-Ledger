const CACHE_NAME = 'mm-ledger-v1792360286935';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css?v=1792360286935',
  './assets/login-bg.jpg',
  './assets/app.js?v=1792360286935',
  './assets/db.js?v=1792360286935',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Do not intercept Cloud Sync API or Firebase API requests
  if (e.request.url.includes('/api/sync') || e.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  // Network-First for core code assets (HTML, CSS, JS) so updates are immediate
  if (e.request.destination === 'style' || e.request.destination === 'script' || e.request.destination === 'document' || e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-First for static assets (images, icons, fonts)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
