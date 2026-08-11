// db-utils.js – Shared IndexedDB helpers for adminMonitorDB_v2
(function(global) {
  const DB_NAME = 'adminMonitorDB_v2';
  const DB_VERSION = 2;
  let dbReady = false;
  let db;
  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbReady && db) { resolve(db); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains('actions'))
          database.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
        if (!database.objectStoreNames.contains('errors'))
          database.createObjectStore('errors', { keyPath: 'id', autoIncrement: true });
        if (!database.objectStoreNames.contains('meta'))
          database.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        dbReady = true;
        resolve(db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }
  async function logToDB(storeName, entry) {
    try {
      const db = await openDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const { id, ...clean } = entry;
      const payload = { ...clean, timestamp: clean.timestamp || new Date().toISOString() };
      return new Promise((resolve, reject) => {
        const req = store.add(payload);
        req.onsuccess = () => {
          // Broadcast to monitoring page (if any)
          try {
            const bc = new BroadcastChannel('app-monitor');
            bc.postMessage({
              type: 'log-entry',
              payload: {
                level: payload.level || 'log',
                message: payload.message || '',
                source: payload.source || 'unknown',
                timestamp: payload.timestamp
              }
            });
            setTimeout(() => bc.close(), 100);
          } catch (e) { /* BroadcastChannel not supported – ignore */ }
          resolve();
        };
        req.onerror = reject;
      });
    } catch (e) { /* silent */ }
  }
  // Expose to the global object (window in pages, self in Service Workers)
  global.openDB = openDB;
  global.logToDB = logToDB;
  // Also attach to the App namespace if it exists
  global.App = global.App || {};
  global.App.openDB = openDB;
  global.App.logToDB = logToDB;
})(typeof self !== 'undefined' ? self : window);