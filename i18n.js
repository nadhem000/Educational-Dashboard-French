// i18n.js – Module de traduction FR / EN / AR (bilingue simple) – v2 (App namespace)
(function() {
  const DEFAULT_LANG = 'fr';
  const translations = {
    fr: {},
    en: {},
    ar: {}
  };
  const bilingualContainers = [];
  const langListeners = [];

  const App = {};
  window.App = App;

  App.addI18nTranslations = function(newTranslations) {
    for (const lang of Object.keys(newTranslations)) {
      if (translations[lang]) {
        Object.assign(translations[lang], newTranslations[lang]);
      } else {
        translations[lang] = { ...newTranslations[lang] };
      }
    }
  };

  // ---- Toast translations (always loaded) ----
  App.addI18nTranslations({
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
      'toast_update_button': 'Actualiser',
      'skip_to_content': 'Aller au contenu principal',
      'back_to_top': 'Retour en haut',
      'theme_switch_to_light': 'Activer le mode clair',
      'theme_switch_to_dark': 'Activer le mode sombre'
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
      'toast_update_button': 'Refresh',
      'skip_to_content': 'Skip to main content',
      'back_to_top': 'Back to top',
      'theme_switch_to_light': 'Switch to light mode',
      'theme_switch_to_dark': 'Switch to dark mode'
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
      'toast_update_button': 'تحديث',
      'skip_to_content': 'تجاوز إلى المحتوى الرئيسي',
      'back_to_top': 'العودة إلى الأعلى',
      'theme_switch_to_light': 'التبديل إلى الوضع الفاتح',
      'theme_switch_to_dark': 'التبديل إلى الوضع الداكن'
    }
  });

  App.translateToastKey = function(lang, key) {
    return (translations[lang] && translations[lang][key]) || key;
  };

  // Public helper to get a translation for the current language
  App.getTranslation = function(key, langOverride) {
    const lang = langOverride || localStorage.getItem('lang') || DEFAULT_LANG;
    return (translations[lang] && translations[lang][key]) || key;
  };

  App.makeBilingual = function(container) {
    if (!container) return;
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      if (!el.dataset.i18nOrig) {
        el.dataset.i18nOrig = el.innerHTML;
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

  App.applyTranslations = function(lang) {
    lang = lang || localStorage.getItem('lang') || DEFAULT_LANG;
    document.querySelectorAll('[data-i18n]').forEach(el => translateElement(el, lang));
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => translateElement(el, lang));
    document.querySelectorAll('[data-i18n-title]').forEach(el => translateElement(el, lang));
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute('aria-label', translations[lang][key]);
      }
    });
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl && translations[lang]) {
      titleEl.textContent = translations[lang][titleEl.dataset.i18n] || titleEl.textContent;
    }
    restoreAllBilingual(lang);

    // Update <html lang>
    document.documentElement.lang = lang;

    // Notify language change listeners
    langListeners.forEach(cb => cb(lang));
  };

  App.initLangSelector = function() {
    const langSelect = document.getElementById('langSelect');
    if (!langSelect) return;
    const savedLang = localStorage.getItem('lang') || DEFAULT_LANG;
    langSelect.value = savedLang;
    langSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      localStorage.setItem('lang', newLang);
      App.applyTranslations(newLang);
    });
    App.applyTranslations(savedLang);
  };

  // Register language change listener
  App.onLangChange = function(callback) {
    if (typeof callback === 'function') {
      langListeners.push(callback);
    }
  };

  // Initial activation if langSelect already exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('langSelect')) App.initLangSelector();
    });
  } else {
    if (document.getElementById('langSelect')) App.initLangSelector();
  }

})();