importScripts('db-utils.js');
importScripts('offline-sync-utils.js');
// Service Worker – Educational Dashboard – French
// ═══════════ OFFLINE SYNC REPLAY ═══════════
const SUPABASE_URL = 'https://bdzvznaoqqfajzuevqyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZ6bmFvcXFmYWp6dWV2cXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODgwNTUsImV4cCI6MjEwMDc2NDA1NX0.mex6LAye9Q-QZPJutCb928Ih1IqFZ-wUbYR02Mg3Ols';

async function refreshSupabaseSession(session) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: session.refresh_token
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.access_token) return null;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || session.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000
    };
  } catch (e) {
    return null;
  }
}

async function syncOfflineActions() {
  try {
    const session = await getOfflineSession();
    if (!session) {
      swLog('info', 'No offline session – skipping sync');
      return;
    }

    const actions = await getOfflineActions(50);
    if (!actions.length) {
      swLog('info', 'No offline actions to sync');
      return;
    }

    let currentSession = session;

    for (const action of actions) {
      // Build request body depending on type
      let requestUrl, requestBody;

      if (action.type === 'general') {
        requestUrl = `${SUPABASE_URL}/rest/v1/rpc/increment_general_action`;
        requestBody = JSON.stringify({
          action_text: action.payload.action,
          user_agent_text: navigator.userAgent
        });
      } else if (action.type === 'user') {
        const user_id = currentSession.user?.id;
        if (!user_id) continue;

        const entry = {
          action: action.payload.action,
          details: action.payload.details || {},
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        };
        requestUrl = `${SUPABASE_URL}/rest/v1/rpc/append_user_action`;
        requestBody = JSON.stringify({
          p_user_id: user_id,
          p_action_entry: entry
        });
      } else {
        await removeOfflineAction(action.id);
        continue;
      }

      const sendRequest = (token) => fetch(requestUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      try {
        let response = await sendRequest(currentSession.access_token);

        if (response.ok) {
          await removeOfflineAction(action.id);
          swLog('info', `Synced offline action: ${action.type}`);
        } else if (response.status === 401) {
          // Token expired – try refresh
          const newSession = await refreshSupabaseSession(currentSession);
          if (newSession) {
            await saveOfflineSession(newSession);
            currentSession = newSession;
            response = await sendRequest(currentSession.access_token);
            if (response.ok) {
              await removeOfflineAction(action.id);
              swLog('info', `Synced offline action after refresh: ${action.type}`);
            } else {
              swLog('error', `Failed to sync action ${action.type} after refresh: ${response.status}`);
            }
          } else {
            swLog('error', 'Token refresh failed – clearing offline session');
            await clearOfflineSession();
          }
        } else {
          swLog('error', `Failed to sync ${action.type}: ${response.status}`);
        }
      } catch (error) {
        swLog('error', `Sync error for ${action.type}: ${error.message}`);
        break; // stop processing further actions
      }
    }
  } catch (error) {
    swLog('error', `Sync failed: ${error.message}`);
  }
}
const CACHE_NAME = 'ed-french-v2.1.2'; // bump version to force cache refresh
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
// ── IndexedDB helpers (using shared db-utils) ─────────────────
async function getMetaValue(key, defaultValue = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
    req.onerror = () => reject(req.error);
  });
}
async function setMetaValue(key, value) {
  const db = await openDB();
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
// Helper: network-first strategy (try network, update cache, fallback to cache)
function networkFirst(request) {
    return fetch(request)
        .then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
            return response;
        })
        .catch(() => {
            swLog('warn', 'Offline: serving from cache - ' + request.url);
            return caches.match(request);
        });
}
// Fetch strategy – network-first for HTML/CSS/JS/JSON/manifest, cache-first for images
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET') return;
    // ──────────────────────────────────────────────────────
    // NAVIGATION REQUESTS – Two strategies
    // Use the uncommented development version now;
    // switch to the commented production version before deploying.
    // ──────────────────────────────────────────────────────
    // ======================================================
    // 🔧 DEVELOPMENT: always fetch from network (no cache)
    // ======================================================
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' })
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
    // ======================================================
    // 📦 PRODUCTION: cache-first, network update in background
    //    Hard refresh (Ctrl+Shift+R) bypasses cache.
    // ======================================================
    /*
    if (event.request.mode === 'navigate') {
        const isHardRefresh = event.request.cache === 'reload' ||
                             event.request.headers.get('Cache-Control')?.includes('no-cache');
        if (isHardRefresh) {
            event.respondWith(
                fetch(event.request, { cache: 'no-cache' })
                    .then(response => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                        return response;
                    })
                    .catch(() => {
                        swLog('warn', 'Offline during hard refresh – falling back to cache');
                        return caches.match(event.request).then(cached => cached || caches.match('/index.html'));
                    })
            );
            return;
        }
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                }).catch(error => {
                    swLog('warn', 'Background update failed – ' + event.request.url);
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
    */
    // For images, fonts, etc. – cache-first with background revalidation
    if (requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/i)) {
        event.respondWith(serveStaleWhileRevalidate(event.request));
        return;
    }
    // For CSS, JS, JSON, manifest – network-first (ensure latest versions)
    if (requestUrl.pathname.match(/\.(json|js|css)$/i) || requestUrl.pathname === '/manifest.json') {
        event.respondWith(networkFirst(event.request));
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
                });
        })
    );
});
// Helper: stale-while-revalidate (for images/fonts)
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
    if (event.tag === 'sync-offline-actions') {
        event.waitUntil(syncOfflineActions());
    }
});
// ── Periodic Background Sync ─────────────────
self.addEventListener('periodicsync', event => {
    if (event.tag === 'version-check' && syncEnabled) {
        event.waitUntil(checkForNewVersion());
    }
});