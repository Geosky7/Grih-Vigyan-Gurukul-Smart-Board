const CACHE_NAME = 'gvg-smartboard-A9';
const CORE_ASSETS = [
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];
const LIB_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install - cache core app files (must succeed) + libraries (best effort, one bad URL won't break the rest)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      await Promise.allSettled(
        LIB_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
      return self.skipWaiting();
    })
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - cache first, fallback to network, cache anything new we successfully fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
      )
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('index.html');
        }
      })
  );
});
