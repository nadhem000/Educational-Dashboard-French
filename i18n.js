// i18n.js – Module de traduction FR / EN / AR (bilingue)
(function() {
  const DEFAULT_LANG = 'fr';
  const translations = {
    fr: {},
    en: {},
    ar: {}
  };

  // Permet aux autres fichiers d'ajouter leurs traductions
  window.addI18nTranslations = function(newTranslations) {
    for (const lang of Object.keys(newTranslations)) {
      if (translations[lang]) {
        Object.assign(translations[lang], newTranslations[lang]);
      } else {
        translations[lang] = { ...newTranslations[lang] };
      }
    }
  };

  // Accès direct à une traduction
  window.getTranslation = function(lang, key) {
    return translations[lang]?.[key] || '';
  };

  function translateElement(el, lang) {
    const t = translations[lang];
    if (!t) return;
    // Skip elements marked as bilingual – they are handled separately
    if (el.dataset.i18nBilingual === 'true') return;

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

    // Exécuter les callbacks (ex : mise à jour bilingue)
    if (window._i18nCallbacks) {
      window._i18nCallbacks.forEach(fn => fn());
    }
  }

  /**
   * Marque tous les éléments data-i18n d'un conteneur comme bilingues.
   * Sauvegarde le contenu HTML français original avant toute traduction.
   */
  window.makeBilingual = function(container) {
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      if (!el.dataset.i18nOrig) {
        el.dataset.i18nOrig = el.innerHTML;   // français original
        el.dataset.i18nBilingual = 'true';    // ne sera plus touché par translateElement
      }
    });
  };

  /**
   * Applique l'affichage bilingue sur un conteneur.
   * - Remet le français original
   * - Ajoute le bloc de traduction en dessous (sauf si la langue = 'fr')
   */
  window.applyBilingualDisplay = function(container, lang) {
    if (!container) return;

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
      bilingualEl.innerHTML = translation;  // pour préserver les <strong> etc.

      el.parentNode.insertBefore(bilingualEl, el.nextSibling);
    });
  };

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