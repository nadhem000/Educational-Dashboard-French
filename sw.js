const CACHE_NAME = 'revisions-tunisie-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/revision.html',
  '/ED-French-ini.js',
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});