// i18n.js – Module de traduction FR / EN / AR (bilingue simple)
(function() {
  const DEFAULT_LANG = 'fr';
  const translations = {
    fr: {},
    en: {},
    ar: {}
  };

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

  // Marque un conteneur comme bilingue et sauvegarde le français original
  window.makeBilingual = function(container) {
    if (!container) return;
    console.log('makeBilingual called on', container.className || container.id);
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

  function restoreAllBilingual(lang) {
    bilingualContainers.forEach(container => {
      container.querySelectorAll('.i18n-bilingual').forEach(el => el.remove());
      if (lang === 'fr') return;
      const elements = container.querySelectorAll('[data-i18n]');
      elements.forEach(el => {
        if (el.dataset.i18nOrig) {
          el.innerHTML = el.dataset.i18nOrig;
        }
        const key = el.dataset.i18n;
        if (!key) return;
        const t = translations[lang];
        if (!t) return;
        const translation = t[key];
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
    restoreAllBilingual(lang);
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