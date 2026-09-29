self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Huwag nang harangin, hayaan lang dumaan ang network requests
  event.respondWith(fetch(event.request));
});
