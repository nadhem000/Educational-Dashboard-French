// i18n.js – Module de traduction FR / EN / AR (moteur uniquement)
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

  // Get a single translation (used by bilingual helper)
  window.getTranslation = function(lang, key) {
    return translations[lang]?.[key] || '';
  };

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

    // Execute registered callbacks (e.g., bilingual updaters)
    if (window._i18nCallbacks) {
      window._i18nCallbacks.forEach(fn => fn());
    }
  }

  // Bilingual helper: appends translation block under each data-i18n element inside container
  window.applyBilingualCards = function(container, lang) {
    if (!container || lang === 'fr') return;
    // Remove previous bilingual elements first
    container.querySelectorAll('.i18n-bilingual').forEach(el => el.remove());

    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.dataset.i18n;
      if (!key) return;
      const translation = window.getTranslation(lang, key);
      if (!translation) return;
      // Skip if the translation is identical to the current text (avoid duplicate)
      if (el.textContent.trim() === translation.trim()) return;

      const bilingualSpan = document.createElement('span');
      bilingualSpan.className = 'i18n-bilingual';
      bilingualSpan.textContent = translation;
      // Insert after the original element
      el.parentNode.insertBefore(bilingualSpan, el.nextSibling);
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