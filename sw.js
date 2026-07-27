// Service Worker – Educational Dashboard – French
const CACHE_NAME = 'revisions-tunisie-v1.5.3'; // bump version to force cache refresh
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
        // ignore
    }
}

// Background sync control (set by main page)
let syncEnabled = false;

// ── IndexedDB helpers (SW scope) ─────────────────
function openSWDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('adminMonitorDB_v2', 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
      }
      // store for meta values (like swVersion)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getMetaValue(key, defaultValue = null) {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
    req.onerror = () => reject(req.error);
  });
}

async function setMetaValue(key, value) {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    store.put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Version check using CACHE_NAME ────────────────
async function checkForNewVersion() {
  try {
    const currentVersion = CACHE_NAME;
    const storedVersion = await getMetaValue('swVersion', null);

    if (storedVersion !== currentVersion) {
      await setMetaValue('swVersion', currentVersion);

      if (storedVersion !== null) {
        // New version detected
        swLog('info', `New version detected: ${currentVersion} (was ${storedVersion})`);
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATE' });
        });
      } else {
        swLog('info', `First version check – setting baseline to ${currentVersion}`);
      }
    } else {
      swLog('info', `Version check: no new version (${currentVersion})`);
    }
  } catch (error) {
    swLog('error', `Version check failed: ${error.message}`);
  }
}

// Installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of urlsToCache) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn('Failed to cache:', url, err);
                }
            }
            return self.skipWaiting();
        })
    );
});

// Activation – delete old caches and notify clients
self.addEventListener('activate', event => {
    swLog('info', 'SW activate – cleaning old caches');
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
            swLog('info', 'Activation finished, claiming clients');
            return self.clients.claim();
        }).then(() => {
            // Notify all clients that an update is available
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATE' });
                });
            });
        })
    );
});

// Fetch strategy – stale-while-revalidate for static assets, network-first for navigations
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET') return;

    // Navigation requests: network first, cache fallback
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

    // For images, fonts, etc.
    if (requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/i)) {
        event.respondWith(serveStaleWhileRevalidate(event.request));
        return;
    }

    // For JSON, JS, CSS, manifest – stale-while-revalidate
    if (requestUrl.pathname.match(/\.(json|js|css)$/i) || requestUrl.pathname === '/manifest.json') {
        event.respondWith(serveStaleWhileRevalidate(event.request));
        return;
    }

    // All other requests: network with timeout fallback
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
                })
        })
    );
});

// Helper: stale-while-revalidate
function serveStaleWhileRevalidate(request) {
    return caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }).catch(() => {
                // network error, ignore
            });
            // Return cached immediately, but update cache in background
            return cachedResponse || fetchPromise;
        });
    });
}

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
    // NEW: receive sync enabled flag
    if (event.data && event.data.type === 'SET_SYNC_ENABLED') {
        syncEnabled = event.data.value;
        swLog('info', `Background sync ${syncEnabled ? 'enabled' : 'disabled'} in SW`);
    }
});

// ── Background Sync ──────────────────────────
self.addEventListener('sync', event => {
    if (event.tag === 'version-check' && syncEnabled) {
        event.waitUntil(checkForNewVersion());
    }
});

// ── Periodic Background Sync ─────────────────
self.addEventListener('periodicsync', event => {
    if (event.tag === 'version-check' && syncEnabled) {
        event.waitUntil(checkForNewVersion());
    }
});