const CACHE_NAME = 'mm-ledger-v1785173995569';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css',
  './assets/app.js?v=1785173995569',
  './assets/db.js?v=1785173995569',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Bypass service worker cache completely for live real-time updates
  return;
});
