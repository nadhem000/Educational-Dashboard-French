// i18n.js – Module de traduction FR / EN / AR (bilingue robuste)
(function() {
  const DEFAULT_LANG = 'fr';
  const translations = {
    fr: {},
    en: {},
    ar: {}
  };

  // Liste des conteneurs à traiter en mode bilingue
  const bilingualContainers = [];

  window.addI18nTranslations = function(newTranslations) {
    for (const lang of Object.keys(newTranslations)) {
      if (translations[lang]) {
        Object.assign(translations[lang], newTranslations[lang]);
      } else {
        translations[lang] = { ...newTranslations[lang] };
      }
    }
  };

  window.getTranslation = function(lang, key) {
    return translations[lang]?.[key] || '';
  };

  /**
   * Enregistre un conteneur pour affichage bilingue.
   * Sauvegarde immédiatement le français original de tous ses éléments [data-i18n].
   */
  window.registerBilingualContainer = function(container) {
    if (!container) return;
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      if (!el.dataset.i18nOrig) {
        el.dataset.i18nOrig = el.innerHTML; // français original
      }
    });
    if (!bilingualContainers.includes(container)) {
      bilingualContainers.push(container);
    }
  };

  /**
   * Restaure le français et ajoute les blocs de traduction pour la langue actuelle.
   */
  function restoreBilingual(lang) {
    bilingualContainers.forEach(container => {
      // Supprimer les anciens blocs de traduction
      container.querySelectorAll('.i18n-bilingual').forEach(el => el.remove());

      if (lang === 'fr') return;

      const elements = container.querySelectorAll('[data-i18n]');
      elements.forEach(el => {
        // Restaurer le français original
        if (el.dataset.i18nOrig) {
          el.innerHTML = el.dataset.i18nOrig;
        }

        const key = el.dataset.i18n;
        if (!key) return;
        const translation = window.getTranslation(lang, key);
        if (!translation || translation.trim() === el.textContent.trim()) return;

        const bilingualEl = document.createElement('span');
        bilingualEl.className = 'i18n-bilingual';
        bilingualEl.innerHTML = translation;
        el.parentNode.insertBefore(bilingualEl, el.nextSibling);
      });
    });
  }

  function translateElement(el, lang) {
    const t = translations[lang];
    if (!t) return;
    if (el.dataset.i18n) {
      el.innerHTML = t[el.dataset.i18n] || el.innerHTML;
    }
    if (el.dataset.i18nPlaceholder) {
      el.placeholder = t[el.dataset.i18nPlaceholder] || el.placeholder;
    }
    if (el.dataset.i18nTitle) {
      el.title = t[el.dataset.i18nTitle] || el.title;
    }
  }

  function applyTranslations(lang) {
    lang = lang || localStorage.getItem('lang') || DEFAULT_LANG;
    document.querySelectorAll('[data-i18n]').forEach(el => translateElement(el, lang));
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => translateElement(el, lang));
    document.querySelectorAll('[data-i18n-title]').forEach(el => translateElement(el, lang));

    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl && translations[lang]) {
      titleEl.textContent = translations[lang][titleEl.dataset.i18n] || titleEl.textContent;
    }

    // Toujours restaurer l'état bilingue après une traduction
    restoreBilingual(lang);

    // Exécuter d'éventuels callbacks supplémentaires (déprécié si on utilise le système bilingue)
    if (window._i18nCallbacks) {
      window._i18nCallbacks.forEach(fn => fn());
    }
  }

  function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) return;
    const savedLang = localStorage.getItem('lang') || DEFAULT_LANG;
    langSelect.value = savedLang;
    langSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      localStorage.setItem('lang', newLang);
      applyTranslations(newLang);
    });
    applyTranslations(savedLang);
  }

  window.applyTranslations = applyTranslations;
  window.initLangSelector = initLangSelector;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('langSelect')) initLangSelector();
    });
  } else {
    if (document.getElementById('langSelect')) initLangSelector();
  }
})();