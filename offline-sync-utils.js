// offline-sync-utils.js – Dedicated offline queue manager
// Uses a separate IndexedDB database so it never interferes with
// the existing adminMonitorDB_v2 or any other application data.
(function(global) {
  'use strict';

  const DB_NAME = 'ed-french-offline-sync';
  const DB_VERSION = 1;
  const STORE_NAME = 'pendingActions';

  let dbPromise = null;

  function openOfflineDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });

    return dbPromise;
  }

  async function enqueueOfflineAction(type, payload) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const entry = {
        type,
        payload,
        timestamp: Date.now(),
        attempts: 0
      };

      const request = store.add(entry);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getOfflineActions(limit = 10) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const request = store.getAll(null, limit);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function removeOfflineAction(id) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function clearOfflineActions() {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Expose functions globally (works in both window and Service Worker)
  global.openOfflineDB = openOfflineDB;
  global.enqueueOfflineAction = enqueueOfflineAction;
  global.getOfflineActions = getOfflineActions;
  global.removeOfflineAction = removeOfflineAction;
  global.clearOfflineActions = clearOfflineActions;

  // Also attach to the App namespace if it exists
  if (global.App) {
    global.App.openOfflineDB = openOfflineDB;
    global.App.enqueueOfflineAction = enqueueOfflineAction;
    global.App.getOfflineActions = getOfflineActions;
    global.App.removeOfflineAction = removeOfflineAction;
    global.App.clearOfflineActions = clearOfflineActions;
  }
})(typeof self !== 'undefined' ? self : window);