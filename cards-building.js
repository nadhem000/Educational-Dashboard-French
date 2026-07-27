// cards-building.js – version 3 (direct French text, bilingual)

(function() {
  // 1. Store French translations locally so we can use them immediately
  const fr = {
    'card.primaire4.title': '4ᵉ année primaire',
    'card.primaire5.title': '5ᵉ année primaire',
    'card.primaire6.title': '6ᵉ année primaire',
    'card.primaire7.title': '7ᵉ année primaire',
    'card.primaire8.title': '8ᵉ année primaire',
    'card.primaire9.title': '9ᵉ année primaire',
    'card.secondaire1.title': '1ʳᵉ année secondaire',
    'card.secondaire2.title': '2ᵉ année secondaire',
    'card.secondaire3.title': '3ᵉ année secondaire',
    'card.secondaire4.title': '4ᵉ année secondaire (Bac)',
    'card.revision.title': '📖 Révision générale',
    'coming_soon': '⏳ Contenu à venir',
    'sections_available': 'Sections disponibles (à venir) :',
    'soon': ' (prochainement)',
    'revision_desc': 'Un programme complet de 8 semaines pour consolider les bases avant le Bac.',
    'revision_link': 'Accéder au programme →'
  };

  // 2. Register translations for all languages
  if (typeof addI18nTranslations === 'function') {
    addI18nTranslations({
      fr: fr,   // reuse the same object
      en: {
        'card.primaire4.title': '4th grade',
        'card.primaire5.title': '5th grade',
        'card.primaire6.title': '6th grade',
        'card.primaire7.title': '7th grade',
        'card.primaire8.title': '8th grade',
        'card.primaire9.title': '9th grade',
        'card.secondaire1.title': '10th grade',
        'card.secondaire2.title': '11th grade',
        'card.secondaire3.title': '12th grade',
        'card.secondaire4.title': '12th grade (Bac)',
        'card.revision.title': '📖 General Review',
        'coming_soon': '⏳ Coming soon',
        'sections_available': 'Available sections (coming soon):',
        'soon': ' (coming soon)',
        'revision_desc': 'An 8-week comprehensive program to strengthen the basics before the Bac.',
        'revision_link': 'Access the program →'
      },
      ar: {
        'card.primaire4.title': 'السنة الرابعة ابتدائي',
        'card.primaire5.title': 'السنة الخامسة ابتدائي',
        'card.primaire6.title': 'السنة السادسة ابتدائي',
        'card.primaire7.title': 'السنة السابعة ابتدائي',
        'card.primaire8.title': 'السنة الثامنة ابتدائي',
        'card.primaire9.title': 'السنة التاسعة ابتدائي',
        'card.secondaire1.title': 'الأولى ثانوي',
        'card.secondaire2.title': 'الثانية ثانوي',
        'card.secondaire3.title': 'الثالثة ثانوي',
        'card.secondaire4.title': 'البكالوريا (السنة الرابعة)',
        'card.revision.title': '📖 مراجعة عامة',
        'coming_soon': '⏳ قريباً',
        'sections_available': 'الأقسام المتاحة (قريباً):',
        'soon': ' (قريباً)',
        'revision_desc': 'برنامج شامل مدته 8 أسابيع لتقوية الأساسيات قبل البكالوريا.',
        'revision_link': 'الوصول إلى البرنامج ←'
      }
    });
  }

  // 3. IndexedDB (unchanged)
  const DB_NAME = 'adminMonitorDB_v2';
  const DB_VERSION = 2;
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
      request.onsuccess = (e) => { db = e.target.result; dbReady = true; resolve(db); };
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

  // 4. Card definitions
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

  // 5. Build cards using French text directly
  cardsData.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card' + (card.type === 'revision' ? ' revision' : '');

    const header = document.createElement('div');
    header.className = 'card-header';
    header.setAttribute('data-i18n', card.titleKey);
    // Use French text as the visible content
    header.innerHTML = (card.type === 'revision' ? '⭐ ' : '📘 ') + (fr[card.titleKey] || card.titleKey);
    cardEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'card-body';

    if (card.type === 'coming') {
      const span = document.createElement('span');
      span.className = 'coming-soon';
      span.setAttribute('data-i18n', 'coming_soon');
      span.innerHTML = fr['coming_soon'];   // French
      body.appendChild(span);
    } else if (card.type === 'secondary') {
      const p = document.createElement('p');
      p.setAttribute('data-i18n', 'sections_available');
      p.innerHTML = fr['sections_available'];  // French
      body.appendChild(p);

      const ul = document.createElement('ul');
      ul.className = 'sections-list';
      card.sections.forEach(sec => {
        const li = document.createElement('li');
        li.textContent = sec + ' (prochainement)';
        li.setAttribute('data-i18n', 'soon');
        ul.appendChild(li);
      });
      body.appendChild(ul);
    } else if (card.type === 'revision') {
      body.innerHTML = `<p data-i18n="revision_desc">${fr['revision_desc']}</p>
                        <a href="${card.link}" data-i18n="revision_link">${fr['revision_link']}</a>`;
    }

    cardEl.appendChild(body);
    grid.appendChild(cardEl);
  });

  // 6. Register grid for bilingual display (saves the French we just set)
  if (typeof makeBilingual === 'function') {
    makeBilingual(grid);
  }

  // 7. Apply translations for the current language (Arabic/English etc.)
  //    This will replace content, but restoreAllBilingual will bring French back + translation.
  if (typeof applyTranslations === 'function') applyTranslations();

  logToDB({ type: 'info', message: 'cards-building.js v3 loaded and cards rendered' });
})();