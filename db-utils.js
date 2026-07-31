// db-utils.js – Shared IndexedDB helpers for adminMonitorDB_v2
(function() {
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
      return new Promise((resolve, reject) => {
        const req = store.add({ ...clean, timestamp: clean.timestamp || new Date().toISOString() });
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    } catch (e) { /* silent */ }
  }

  // Attach to App namespace (created by i18n.js)
  window.App = window.App || {};
  window.App.openDB = openDB;
  window.App.logToDB = logToDB;
})();