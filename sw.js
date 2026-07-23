const CACHE_NAME = 'revisions-tunisie-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/revision.html',
  '/ED-French-ini.js',
  '/ED-French-header.html',
  '/ED-French-footer.html',
  '/manifest.json',
  '/icon-96x96.png',
  '/semaine1-classes-grammaticales.html',
  '/semaine1-fonctions-essentielles.html',
  '/semaine1-conjugaison-temps-simples.html',
  '/semaine1-conjugaison-temps-composes.html',
  '/semaine1-accord-sujet-verbe.html',
  '/semaine1-accord-participe-passe.html',
  '/semaine1-expression-ecrite.html',
  '/semaine1-etude-texte.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        // Only cache successful responses that are not HTML error pages
        if (response.ok && response.headers.get('Content-Type')?.includes('javascript')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});