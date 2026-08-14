// offline-sync-utils.js – Dedicated offline queue and session manager
// Uses a separate IndexedDB database so it never interferes with
// the existing adminMonitorDB_v2 or any other application data.
(function(global) {
  'use strict';

  const DB_NAME = 'ed-french-offline-sync';
  const DB_VERSION = 2; // bumped to add authSession store
  const QUEUE_STORE = 'pendingActions';
  const SESSION_STORE = 'authSession';
  const SESSION_KEY = 'current';

  let dbPromise = null;

  function openOfflineDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE, { keyPath: 'key' });
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

  // --- Offline action queue functions ---

  async function enqueueOfflineAction(type, payload) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);

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
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);

      const request = store.getAll(null, limit);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function removeOfflineAction(id) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);

      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function clearOfflineActions() {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);

      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Session storage functions ---

  async function saveOfflineSession(session) {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSION_STORE, 'readwrite');
      const store = tx.objectStore(SESSION_STORE);
      store.put({ key: SESSION_KEY, session });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getOfflineSession() {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSION_STORE, 'readonly');
      const store = tx.objectStore(SESSION_STORE);
      const request = store.get(SESSION_KEY);
      request.onsuccess = () => resolve(request.result ? request.result.session : null);
      request.onerror = () => reject(request.error);
    });
  }

  async function clearOfflineSession() {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSION_STORE, 'readwrite');
      const store = tx.objectStore(SESSION_STORE);
      store.delete(SESSION_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Expose functions globally ---
  global.openOfflineDB = openOfflineDB;
  global.enqueueOfflineAction = enqueueOfflineAction;
  global.getOfflineActions = getOfflineActions;
  global.removeOfflineAction = removeOfflineAction;
  global.clearOfflineActions = clearOfflineActions;
  global.saveOfflineSession = saveOfflineSession;
  global.getOfflineSession = getOfflineSession;
  global.clearOfflineSession = clearOfflineSession;

  // Also attach to the App namespace if it exists
  if (global.App) {
    global.App.openOfflineDB = openOfflineDB;
    global.App.enqueueOfflineAction = enqueueOfflineAction;
    global.App.getOfflineActions = getOfflineActions;
    global.App.removeOfflineAction = removeOfflineAction;
    global.App.clearOfflineActions = clearOfflineActions;
    global.App.saveOfflineSession = saveOfflineSession;
    global.App.getOfflineSession = getOfflineSession;
    global.App.clearOfflineSession = clearOfflineSession;
  }
})(typeof self !== 'undefined' ? self : window);