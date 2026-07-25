// Service Worker – Educational Dashboard – French
const CACHE_NAME = 'revisions-tunisie-v1.2.2';
const urlsToCache = [
    '/',
    '/index.html',
    '/revision.html',
    '/manifest.json',
    '/assets/icons/icon-96x96.png',
    '/assets/icons/icon-152x152.png',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

// ═══════════ LOG HELPER (posts to all clients) ═══════════
async function swLog(level, message) {
    try {
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        allClients.forEach(client => {
            client.postMessage({ type: 'SW_LOG', payload: { level, message } });
        });
    } catch (e) {
        // worst case: ignore
    }
}

// Installation
self.addEventListener('install', event => {
    swLog('info', 'SW install start');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                swLog('info', 'Caching essential resources');
                return cache.addAll(urlsToCache).catch(err => {
                    swLog('warn', 'Some resources failed to cache: ' + err);
                });
            })
            .then(() => {
                swLog('info', 'Install complete, skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activation
self.addEventListener('activate', event => {
    swLog('info', 'SW activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        swLog('info', 'Deleting old cache: ' + cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            swLog('info', 'Activation finished');
            return self.clients.claim();
        })
    );
});

// Fetch strategy
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method !== 'GET') return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    swLog('warn', 'Offline: serving from cache - ' + event.request.url);
                    return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
                })
        );
        return;
    }

    if (requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                }).catch(() => {
                    swLog('warn', 'Image load failed: ' + event.request.url);
                });
            })
        );
        return;
    }

    if (requestUrl.pathname.match(/\.(json|js|css|woff2?)$/i) || requestUrl.pathname === '/manifest.json') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    event.respondWith(
        new Promise(resolve => {
            let didTimeout = false;
            const timeout = setTimeout(() => {
                didTimeout = true;
                caches.match(event.request).then(cached => {
                    if (cached) resolve(cached);
                });
            }, 3000);

            fetch(event.request)
                .then(response => {
                    clearTimeout(timeout);
                    if (!didTimeout) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                        resolve(response);
                    }
                })
                .catch(() => {
                    clearTimeout(timeout);
                    caches.match(event.request).then(cached => {
                        resolve(cached || new Response('Ressource indisponible hors ligne', { status: 503 }));
                    });
                });
        })
    );
});

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            swLog('info', 'Cache manually cleared');
        });
    }
});