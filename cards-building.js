// cards-building.js – version 5.4 (added links for grades 5, 7, 9 – App namespace)
(function() {
  // 1. Store French translations locally so we can use them immediately
  const fr = {
    'card.primaire4.title': '4ᵉ année primaire',
    'card.primaire4.desc': 'Programme complet de la 4ème année primaire avec 10 unités.',
    'card.primaire4.link': 'Accéder au programme →',
    'card.primaire5.title': '5ᵉ année primaire',
    'card.primaire5.desc': 'Programme complet de la 5ème année primaire avec 6 unités.',
    'card.primaire5.link': 'Accéder au programme →',
    'card.primaire6.title': '6ᵉ année primaire',
    'card.primaire7.title': '7ᵉ année primaire',
    'card.primaire7.desc': 'Programme complet de la 7ème année primaire avec 6 unités.',
    'card.primaire7.link': 'Accéder au programme →',
    'card.primaire8.title': '8ᵉ année primaire',
    'card.primaire9.title': '9ᵉ année primaire',
    'card.primaire9.desc': 'Programme complet de la 9ème année primaire avec 6 unités.',
    'card.primaire9.link': 'Accéder au programme →',
    'card.secondaire1.title': '1ʳᵉ année secondaire',
    'card.secondaire2.title': '2ᵉ année secondaire',
    'card.secondaire3.title': '3ᵉ année secondaire',
    'card.secondaire4.title': '4ᵉ année secondaire (Bac)',
    'section_lettres': 'Section Lettres',
    'section_sciences': 'Section Sciences',
    'section_economie': 'Section Économie',
    'section_informatique': 'Section Informatique',
    'section_mathematiques': 'Section Mathématiques',
    'section_technique': 'Section Technique',
    'card.revision.title': '📖 Révision générale',
    'coming_soon': '⏳ Contenu à venir',
    'sections_available': 'Sections disponibles (à venir) :',
    'soon': ' (prochainement)',
    'access_section': 'Accéder →',
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
      'card.primaire5.title': '5th basic grade',
      'card.primaire5.desc': 'Complete 5th year primary program with 6 units.',
      'card.primaire5.link': 'Access the program →',
      'card.primaire6.title': '6th basic grade',
      'card.primaire7.title': '7th basic grade',
      'card.primaire7.desc': 'Complete 7th year primary program with 6 units.',
      'card.primaire7.link': 'Access the program →',
      'card.primaire8.title': '8th basic grade',
      'card.primaire9.title': '9th basic grade',
      'card.primaire9.desc': 'Complete 9th year primary program with 6 units.',
      'card.primaire9.link': 'Access the program →',
      'card.secondaire1.title': '1st secondary grade',
      'card.secondaire2.title': '2nd secondary grade',
      'card.secondaire3.title': '3rd secondary grade',
      'card.secondaire4.title': '4th secondary grade (Bac)',
      'section_lettres': 'Literature Section',
      'section_sciences': 'Science Section',
      'section_economie': 'Economics Section',
      'section_informatique': 'Computer Science Section',
      'section_mathematiques': 'Mathematics Section',
      'section_technique': 'Technical Section',
      'card.revision.title': '📖 General Review',
      'coming_soon': '⏳ Coming soon',
      'sections_available': 'Available sections (coming soon):',
      'soon': ' (coming soon)',
      'access_section': 'Access →',
      'revision_desc': 'An 8-week comprehensive program to strengthen the basics before the Bac.',
      'revision_link': 'Access the program →',
      'cards_error': '❌ Unable to load cards. Please try again.'
    },
    ar: {
      'card.primaire4.title': 'السنة الرابعة ابتدائي',
      'card.primaire4.desc': 'البرنامج الكامل للسنة الرابعة ابتدائي مع 10 وحدات.',
      'card.primaire4.link': 'الوصول إلى البرنامج ←',
      'card.primaire5.title': 'السنة الخامسة ابتدائي',
      'card.primaire5.desc': 'البرنامج الكامل للسنة الخامسة ابتدائي مع 6 وحدات.',
      'card.primaire5.link': 'الوصول إلى البرنامج ←',
      'card.primaire6.title': 'السنة السادسة ابتدائي',
      'card.primaire7.title': 'السنة السابعة ابتدائي',
      'card.primaire7.desc': 'البرنامج الكامل للسنة السابعة ابتدائي مع 6 وحدات.',
      'card.primaire7.link': 'الوصول إلى البرنامج ←',
      'card.primaire8.title': 'السنة الثامنة ابتدائي',
      'card.primaire9.title': 'السنة التاسعة ابتدائي',
      'card.primaire9.desc': 'البرنامج الكامل للسنة التاسعة ابتدائي مع 6 وحدات.',
      'card.primaire9.link': 'الوصول إلى البرنامج ←',
      'card.secondaire1.title': 'الأولى ثانوي',
      'card.secondaire2.title': 'الثانية ثانوي',
      'card.secondaire3.title': 'الثالثة ثانوي',
      'card.secondaire4.title': 'البكالوريا (السنة الرابعة)',
      'section_lettres': 'شعبة الآداب',
      'section_sciences': 'شعبة العلوم',
      'section_economie': 'شعبة الاقتصاد والتصرف',
      'section_informatique': 'شعبة الإعلامية',
      'section_mathematiques': 'شعبة الرياضيات',
      'section_technique': 'شعبة التقنية',
      'card.revision.title': '📖 مراجعة عامة',
      'coming_soon': '⏳ قريباً',
      'sections_available': 'الأقسام المتاحة (قريباً):',
      'soon': ' (قريباً)',
      'access_section': 'الوصول ←',
      'revision_desc': 'برنامج شامل مدته 8 أسابيع لتقوية الأساسيات قبل البكالوريا.',
      'revision_link': 'الوصول إلى البرنامج ←',
      'cards_error': '❌ تعذّر تحميل البطاقات. يرجى المحاولة مرة أخرى.'
    }
  });

  // Card definitions – now includes active links for grades 5, 7, 9
  const cardsData = [
    { id: 'primaire4', titleKey: 'card.primaire4.title', type: 'degree', link: 'degree4.html', descKey: 'card.primaire4.desc', linkKey: 'card.primaire4.link' },
    { id: 'primaire5', titleKey: 'card.primaire5.title', type: 'degree', link: 'degree5.html', descKey: 'card.primaire5.desc', linkKey: 'card.primaire5.link' },
    { id: 'primaire6', titleKey: 'card.primaire6.title', type: 'coming' },
    { id: 'primaire7', titleKey: 'card.primaire7.title', type: 'degree', link: 'degree7.html', descKey: 'card.primaire7.desc', linkKey: 'card.primaire7.link' },
    { id: 'primaire8', titleKey: 'card.primaire8.title', type: 'coming' },
    { id: 'primaire9', titleKey: 'card.primaire9.title', type: 'degree', link: 'degree9.html', descKey: 'card.primaire9.desc', linkKey: 'card.primaire9.link' },
    { id: 'secondaire1', titleKey: 'card.secondaire1.title', type: 'coming' },
    { id: 'secondaire2', titleKey: 'card.secondaire2.title', type: 'secondary', sections: ['section_lettres', 'section_sciences', 'section_economie', 'section_informatique'] },
    { id: 'secondaire3', titleKey: 'card.secondaire3.title', type: 'secondary', sections: ['section_lettres', 'section_sciences', 'section_economie', 'section_mathematiques', 'section_technique', 'section_informatique'] },
    {
      id: 'secondaire4',
      titleKey: 'card.secondaire4.title',
      type: 'secondary',
      sections: ['section_lettres', 'section_sciences', 'section_economie', 'section_mathematiques', 'section_technique', 'section_informatique'],
      activeSection: 'section_economie',
      sectionLink: 'degree4sec_secEco.html'
    },
    { id: 'revision', titleKey: 'card.revision.title', type: 'revision', link: 'revision.html' }
  ];

  const grid = document.getElementById('cardGrid');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    cardsData.forEach(card => {
      const cardEl = document.createElement('div');
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

        card.sections.forEach(secKey => {
          const li = document.createElement('li');

          // Section name span
          const secSpan = document.createElement('span');
          secSpan.setAttribute('data-i18n', secKey);
          secSpan.textContent = fr[secKey];
          li.appendChild(secSpan);

          // If this section is active and has a link, make it clickable
          if (card.activeSection && secKey === card.activeSection && card.sectionLink) {
            const link = document.createElement('a');
            link.href = card.sectionLink;
            link.className = 'section-link';
            link.setAttribute('data-i18n', 'access_section');
            link.textContent = fr['access_section'];
            li.appendChild(link);
            li.classList.add('active-section');
          } else {
            // Otherwise, show " (prochainement)"
            const suffixSpan = document.createElement('span');
            suffixSpan.setAttribute('data-i18n', 'soon');
            suffixSpan.textContent = fr['soon'];
            li.appendChild(suffixSpan);
          }

          ul.appendChild(li);
        });

        body.appendChild(ul);
      } else if (card.type === 'revision' || card.type === 'degree') {
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
    App.logToDB('actions', { type: 'info', message: 'cards-building.js v5.4 loaded and cards rendered' });
  } catch (error) {
    grid.innerHTML = `<div class="card"><div class="card-body" data-i18n="cards_error">${fr['cards_error']}</div></div>`;
    App.logToDB('errors', { type: 'error', message: 'cards-building.js failed: ' + error.message });
  }
})();