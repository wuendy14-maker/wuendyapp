const CACHE_NAME = 'wendyapp-v1';
const FILES_TO_CACHE = [
  '/',
  '/calorias.html',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE).catch(err => {
        console.log('Algunos archivos no pudieron cachearse:', err);
        // No fallar si algún archivo no se puede cachear
        return cache.addAll(FILES_TO_CACHE.filter(f => f !== '/' && f !== '/index.html'));
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request).then(response => {
          return response || new Response('Offline - recurso no disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({'Content-Type': 'text/plain'})
          });
        });
      })
  );
});
