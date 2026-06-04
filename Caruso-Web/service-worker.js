const CACHE_NAME = 'caruso-v2';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './renderer.js',
  '../Assets/Caruso%20Pwa%20Logo.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Clean up old caches
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all open pages immediately
});

self.addEventListener('fetch', event => {
  // Network First strategy: Try the network, fall back to cache if offline
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If the fetch is successful, update the cache
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If the fetch fails (e.g., offline), fall back to the cache
        return caches.match(event.request);
      })
  );
});
