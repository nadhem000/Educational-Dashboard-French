// cards-building.js
(function() {
  // MINI LOGGER (writes to testing DB) – inchangé
  const DB_NAME = 'adminMonitorDB_v2';
  const DB_VERSION = 1;
  let dbReady = false;
  let db;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('actions')) {
          db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        dbReady = true;
        resolve(db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function logToDB(entry) {
    try {
      if (!dbReady) await openDB();
      const tx = db.transaction('actions', 'readwrite');
      const store = tx.objectStore('actions');
      const { id, ...clean } = entry;
      await new Promise((resolve, reject) => {
        const req = store.add({ ...clean, timestamp: clean.timestamp || new Date().toISOString() });
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    } catch (e) { /* silent */ }
  }

  // Card building logic
  const cardsData = [
    { id: 'primaire4', titleKey: 'card.primaire4.title', type: 'coming' },
    { id: 'primaire5', titleKey: 'card.primaire5.title', type: 'coming' },
    { id: 'primaire6', titleKey: 'card.primaire6.title', type: 'coming' },
    { id: 'primaire7', titleKey: 'card.primaire7.title', type: 'coming' },
    { id: 'primaire8', titleKey: 'card.primaire8.title', type: 'coming' },
    { id: 'primaire9', titleKey: 'card.primaire9.title', type: 'coming' },
    { id: 'secondaire1', titleKey: 'card.secondaire1.title', type: 'coming' },
    { id: 'secondaire2', titleKey: 'card.secondaire2.title', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Économie'] },
    { id: 'secondaire3', titleKey: 'card.secondaire3.title', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Mathématiques'] },
    { id: 'secondaire4', titleKey: 'card.secondaire4.title', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Techniques'] },
    { id: 'revision', titleKey: 'card.revision.title', type: 'revision', link: 'revision.html' }
  ];

  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  cardsData.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card' + (card.type === 'revision' ? ' revision' : '');

    const header = document.createElement('div');
    header.className = 'card-header';
    header.setAttribute('data-i18n', card.titleKey);
    header.innerHTML = (card.type === 'revision' ? '⭐ ' : '📘 ') + card.titleKey; // Placeholder avant traduction
    cardEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'card-body';

    if (card.type === 'coming') {
      body.innerHTML = '<span class="coming-soon" data-i18n="coming_soon">⏳ Contenu à venir</span>';
    } else if (card.type === 'secondary') {
      body.innerHTML = '<p data-i18n="sections_available">Sections disponibles (à venir) :</p>';
      const ul = document.createElement('ul');
      ul.className = 'sections-list';
      card.sections.forEach(sec => {
        const li = document.createElement('li');
        li.textContent = sec + ' (prochainement)'; // sera remplacé par la traduction
        li.setAttribute('data-i18n', 'soon');
        ul.appendChild(li);
      });
      body.appendChild(ul);
    } else if (card.type === 'revision') {
      body.innerHTML = `<p data-i18n="revision_desc">Un programme complet de 8 semaines pour consolider les bases avant le Bac.</p>
                        <a href="${card.link}" data-i18n="revision_link">Accéder au programme →</a>`;
    }

    cardEl.appendChild(body);
    grid.appendChild(cardEl);
  });

  // Appliquer les traductions après la construction des cartes
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }

  logToDB({ type: 'info', message: 'cards-building.js loaded and cards rendered' });
})();