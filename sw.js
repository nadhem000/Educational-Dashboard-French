const CACHE_NAME = 'revisions-tunisie-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/revision.html',
  '/ED-French-header.html',
  '/ED-French-footer.html',
  '/ED-French-ini.js',
  '/manifest.json',
  '/icon-96x96.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});