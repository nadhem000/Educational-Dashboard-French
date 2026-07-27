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

  // ---- Toast translations (always loaded) ----
  window.addI18nTranslations({
    fr: {
      'toast_signin_success': '✅ Vous êtes connecté.',
      'toast_signup_success': '✅ Compte créé et connecté.',
      'toast_signout': '👋 Vous êtes déconnecté.',
      'toast_forgot_password': '🔧 Fonctionnalité à venir – Mot de passe oublié.',
      'toast_bg_sync_enabled': '🔄 Synchronisation arrière‑plan activée (simulation).',
      'toast_bg_sync_disabled': '🔄 Synchronisation arrière‑plan désactivée.',
      'toast_notif_enabled': '🔔 Notifications activées (simulation).',
      'toast_notif_disabled': '🔔 Notifications désactivées.',
      'toast_install_prompt': '💡 Pour installer l\'application, utilisez l\'option "Ajouter à l\'écran d\'accueil" du navigateur.',
      'toast_update_available': '🔄 Une nouvelle version est disponible.',
      'toast_update_button': 'Actualiser'
    },
    en: {
      'toast_signin_success': '✅ You are signed in.',
      'toast_signup_success': '✅ Account created and signed in.',
      'toast_signout': '👋 You have been signed out.',
      'toast_forgot_password': '🔧 Forgot password feature coming soon.',
      'toast_bg_sync_enabled': '🔄 Background sync enabled (mock).',
      'toast_bg_sync_disabled': '🔄 Background sync disabled.',
      'toast_notif_enabled': '🔔 Notifications enabled (mock).',
      'toast_notif_disabled': '🔔 Notifications disabled.',
      'toast_install_prompt': '💡 To install the app, use the "Add to Home Screen" option in your browser.',
      'toast_update_available': '🔄 A new version is available.',
      'toast_update_button': 'Refresh'
    },
    ar: {
      'toast_signin_success': '✅ تم تسجيل الدخول بنجاح.',
      'toast_signup_success': '✅ تم إنشاء الحساب وتسجيل الدخول.',
      'toast_signout': '👋 تم تسجيل الخروج.',
      'toast_forgot_password': '🔧 ميزة نسيت كلمة المرور قريباً.',
      'toast_bg_sync_enabled': '🔄 تم تفعيل المزامنة الخلفية (محاكاة).',
      'toast_bg_sync_disabled': '🔄 تم تعطيل المزامنة الخلفية.',
      'toast_notif_enabled': '🔔 تم تفعيل الإشعارات (محاكاة).',
      'toast_notif_disabled': '🔔 تم تعطيل الإشعارات.',
      'toast_install_prompt': '💡 لتثبيت التطبيق، استخدم خيار "إضافة إلى الشاشة الرئيسية" في متصفحك.',
      'toast_update_available': '🔄 تتوفر نسخة جديدة.',
      'toast_update_button': 'تحديث'
    }
  });
window.translateToastKey = function(lang, key) {
    return translations[lang]?.[key] || key;
};

  // Marque un conteneur comme bilingue et sauvegarde le français original
  window.makeBilingual = function(container) {
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