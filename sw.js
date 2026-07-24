// Service Worker – Révisions Tunisie
const CACHE_NAME = 'revisions-tunisie-v1.0.7';
const urlsToCache = [
  '/',
  '/index.html',
  '/revision.html',
  '/manifest.json',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installation : pré-cache des ressources essentielles
self.addEventListener('install', event => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des ressources essentielles');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('[SW] Certaines ressources n\'ont pas pu être mises en cache :', err);
        });
      })
      .then(() => {
        console.log('[SW] Installation terminée, le service worker prend le contrôle');
        return self.skipWaiting();
      })
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation terminée');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache : Cache First pour les ressources statiques, Network First pour la navigation
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Ne pas intercepter les requêtes non GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Navigation : stratégie Network First avec fallback cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mise en cache de la page fraîchement récupérée
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Hors ligne : servir depuis le cache
          console.log('[SW] Hors ligne, service depuis le cache :', event.request.url);
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Page de fallback si même le cache est vide
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Images et icônes : Cache First
  if (requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          // Image de fallback si nécessaire
          console.warn('[SW] Impossible de charger l\'image :', event.request.url);
        });
      })
    );
    return;
  }

  // Manifest et autres ressources statiques : Cache First
  if (requestUrl.pathname.match(/\.(json|js|css|woff2?)$/i) || 
      requestUrl.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Pour toutes les autres requêtes : Network First avec timeout
  event.respondWith(
    new Promise((resolve) => {
      let didTimeout = false;
      const timeout = setTimeout(() => {
        didTimeout = true;
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            resolve(cachedResponse);
          }
        });
      }, 3000); // 3 secondes de timeout

      fetch(event.request)
        .then(response => {
          clearTimeout(timeout);
          if (!didTimeout) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            resolve(response);
          }
        })
        .catch(() => {
          clearTimeout(timeout);
          caches.match(event.request).then(cachedResponse => {
            resolve(cachedResponse || new Response('Ressource indisponible hors ligne', { status: 503 }));
          });
        });
    })
  );
});

// Écoute des messages pour forcer la mise à jour
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache nettoyé manuellement');
    });
  }
});
