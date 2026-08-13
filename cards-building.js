// cards-building.js – version 5 (with degree4 link, error handling, accessibility) – App namespace
(function() {
  // 1. Store French translations locally so we can use them immediately
  const fr = {
    'card.primaire4.title': '4ᵉ année primaire',
    'card.primaire4.desc': 'Programme complet de la 4ème année primaire avec 10 unités.',
    'card.primaire4.link': 'Accéder au programme →',
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
    'revision_link': 'Accéder au programme →',
    'cards_error': '❌ Impossible de charger les cartes. Veuillez réessayer.'
  };
  // 2. Register translations for all languages
  App.addI18nTranslations({
    fr: fr,
    en: {
      'card.primaire4.title': '4th grade',
      'card.primaire4.desc': 'Complete 4th year primary program with 10 units.',
      'card.primaire4.link': 'Access the program →',
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
      'revision_link': 'Access the program →',
      'cards_error': '❌ Unable to load cards. Please try again.'
    },
    ar: {
      'card.primaire4.title': 'السنة الرابعة ابتدائي',
      'card.primaire4.desc': 'البرنامج الكامل للسنة الرابعة ابتدائي مع 10 وحدات.',
      'card.primaire4.link': 'الوصول إلى البرنامج ←',
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
      'revision_link': 'الوصول إلى البرنامج ←',
      'cards_error': '❌ تعذّر تحميل البطاقات. يرجى المحاولة مرة أخرى.'
    }
  });
  // Card definitions
  const cardsData = [
    { id: 'primaire4', titleKey: 'card.primaire4.title', type: 'degree', link: 'degree4.html', descKey: 'card.primaire4.desc', linkKey: 'card.primaire4.link' },
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
  grid.innerHTML = '';
  try {
    cardsData.forEach(card => {
      const cardEl = document.createElement('div');
      // Treat 'degree' like 'revision' for styling and interactivity
      cardEl.className = 'card' + (card.type === 'revision' || card.type === 'degree' ? ' revision' : '');
      if (card.type === 'revision' || card.type === 'degree') {
        cardEl.setAttribute('tabindex', '0');
      } else {
        cardEl.setAttribute('aria-disabled', 'true');
        cardEl.setAttribute('tabindex', '-1');
      }
      const header = document.createElement('div');
      header.className = 'card-header';
      header.setAttribute('data-i18n', card.titleKey);
      header.innerHTML = (card.type === 'revision' ? '⭐ ' : '📘 ') + (fr[card.titleKey] || card.titleKey);
      cardEl.appendChild(header);
      const body = document.createElement('div');
      body.className = 'card-body';
      if (card.type === 'coming') {
        const span = document.createElement('span');
        span.className = 'coming-soon';
        span.setAttribute('data-i18n', 'coming_soon');
        span.innerHTML = fr['coming_soon'];
        body.appendChild(span);
      } else if (card.type === 'secondary') {
        const p = document.createElement('p');
        p.setAttribute('data-i18n', 'sections_available');
        p.innerHTML = fr['sections_available'];
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
      } else if (card.type === 'revision' || card.type === 'degree') {
        // Use custom description and link keys for degree, fallback to revision defaults
        const descKey = card.descKey || 'revision_desc';
        const linkKey = card.linkKey || 'revision_link';
        body.innerHTML = `<p data-i18n="${descKey}">${fr[descKey]}</p>
                        <a href="${card.link}" data-i18n="${linkKey}">${fr[linkKey]}</a>`;
      }
      cardEl.appendChild(body);
      grid.appendChild(cardEl);
    });
    if (typeof App.makeBilingual === 'function') {
      App.makeBilingual(grid);
    }
    App.applyTranslations();
    App.logToDB('actions', { type: 'info', message: 'cards-building.js v5 loaded and cards rendered' });
  } catch (error) {
    grid.innerHTML = `<div class="card"><div class="card-body" data-i18n="cards_error">${fr['cards_error']}</div></div>`;
    App.logToDB('errors', { type: 'error', message: 'cards-building.js failed: ' + error.message });
  }
})();