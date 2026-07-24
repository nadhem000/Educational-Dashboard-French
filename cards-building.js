// cards-building.js
(function() {
    // ═══════════════ MINI LOGGER (writes to testing DB) ═══════════════
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
            // strip any accidental id to avoid constraint errors
            const { id, ...clean } = entry;
            await new Promise((resolve, reject) => {
                const req = store.add({ ...clean, timestamp: clean.timestamp || new Date().toISOString() });
                req.onsuccess = resolve;
                req.onerror = reject;
            });
        } catch (e) {
            // silently ignore – prevent any console output
        }
    }

    // ── Card building logic ──
    const cardsData = [
        { id: 'primaire4', title: '4ᵉ année primaire', type: 'coming' },
        { id: 'primaire5', title: '5ᵉ année primaire', type: 'coming' },
        { id: 'primaire6', title: '6ᵉ année primaire', type: 'coming' },
        { id: 'primaire7', title: '7ᵉ année primaire', type: 'coming' },
        { id: 'primaire8', title: '8ᵉ année primaire', type: 'coming' },
        { id: 'primaire9', title: '9ᵉ année primaire', type: 'coming' },
        { id: 'secondaire1', title: '1ʳᵉ année secondaire', type: 'coming' },
        { id: 'secondaire2', title: '2ᵉ année secondaire', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Économie'] },
        { id: 'secondaire3', title: '3ᵉ année secondaire', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Mathématiques'] },
        { id: 'secondaire4', title: '4ᵉ année secondaire (Bac)', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Techniques'] },
        { id: 'revision', title: '📖 Révision générale', type: 'revision', link: 'revision.html' }
    ];

    const grid = document.getElementById('cardGrid');
    if (!grid) return;

    cardsData.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card' + (card.type === 'revision' ? ' revision' : '');
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = (card.type === 'revision' ? '⭐ ' : '📘 ') + card.title;
        cardEl.appendChild(header);
        const body = document.createElement('div');
        body.className = 'card-body';
        if (card.type === 'coming') {
            body.innerHTML = '<span class="coming-soon">⏳ Contenu à venir</span>';
        } else if (card.type === 'secondary') {
            body.innerHTML = '<p>Sections disponibles (à venir) :</p>';
            const ul = document.createElement('ul');
            ul.className = 'sections-list';
            card.sections.forEach(sec => {
                const li = document.createElement('li');
                li.textContent = sec + ' (prochainement)';
                ul.appendChild(li);
            });
            body.appendChild(ul);
        } else if (card.type === 'revision') {
            body.innerHTML = `<p>Un programme complet de 8 semaines pour consolider les bases avant le Bac.</p><a href="${card.link}">Accéder au programme →</a>`;
        }
        cardEl.appendChild(body);
        grid.appendChild(cardEl);
    });

    // Log a success action silently
    logToDB({ type: 'info', message: 'cards-building.js loaded and cards rendered' });
})();