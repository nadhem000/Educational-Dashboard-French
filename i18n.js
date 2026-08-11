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
      'theme_switch_to_dark': 'Activer le mode sombre',
'auth_error_prefix': 'Erreur de connexion : ',
'auth_error_signup_prefix': "Erreur d'inscription : ",
'auth_error_confirm_email': 'Un email de confirmation a été envoyé. Vérifiez votre boîte de réception.',
'auth_error_email_required': 'Veuillez entrer votre email dans le champ Email.',
'auth_error_reset_sent': 'Email de réinitialisation envoyé (vérifiez vos spams).',
'auth_error_generic': 'Erreur : ',
// Common Supabase error messages (exact match)
'Invalid login credentials': 'Email ou mot de passe incorrect.',
'User not found': 'Aucun compte trouvé avec cet email.',
'Email not confirmed': 'Votre email n’a pas encore été confirmé. Veuillez vérifier votre boîte de réception.',
'User already registered': 'Un compte avec cet email existe déjà.',
'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
'username_updated': 'Nom d’utilisateur mis à jour.',
'email_updated': 'Email mis à jour. Vérifiez votre boîte de réception pour confirmer.',
'error_wrong_password': 'Mot de passe incorrect.',
'error_update_username': 'Erreur lors de la mise à jour du nom d’utilisateur.',
'error_update_email': 'Erreur lors de la mise à jour de l’email.',
'profile_error_load': 'Impossible de charger le profil.'
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
      'theme_switch_to_dark': 'Switch to dark mode',
'auth_error_prefix': 'Login error: ',
'auth_error_signup_prefix': 'Sign up error: ',
'auth_error_confirm_email': 'A confirmation email has been sent. Please check your inbox.',
'auth_error_email_required': 'Please enter your email in the Email field.',
'auth_error_reset_sent': 'Password reset email sent (check your spam).',
'auth_error_generic': 'Error: ',
'Invalid login credentials': 'Invalid email or password.',
'User not found': 'No account found with this email.',
'Email not confirmed': 'Your email has not been confirmed yet. Please check your inbox.',
'User already registered': 'An account with this email already exists.',
'Password should be at least 6 characters': 'Password must be at least 6 characters.',
'username_updated': 'Username updated.',
'email_updated': 'Email updated. Check your inbox to confirm.',
'error_wrong_password': 'Incorrect password.',
'error_update_username': 'Error updating username.',
'error_update_email': 'Error updating email.',
'profile_error_load': 'Could not load profile.'
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
      'theme_switch_to_dark': 'التبديل إلى الوضع الداكن',
'auth_error_prefix': 'خطأ في تسجيل الدخول: ',
'auth_error_signup_prefix': 'خطأ في إنشاء الحساب: ',
'auth_error_confirm_email': 'تم إرسال بريد تأكيد. يرجى التحقق من صندوق الوارد.',
'auth_error_email_required': 'يرجى إدخال بريدك الإلكتروني في حقل البريد.',
'auth_error_reset_sent': 'تم إرسال بريد إعادة تعيين كلمة المرور (تفقد البريد العشوائي).',
'auth_error_generic': 'خطأ: ',
'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
'User not found': 'لم يتم العثور على حساب بهذا البريد.',
'Email not confirmed': 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من صندوق الوارد.',
'User already registered': 'يوجد حساب مسجل بهذا البريد مسبقاً.',
'Password should be at least 6 characters': 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.',
'username_updated': 'تم تحديث اسم المستخدم.',
'email_updated': 'تم تحديث البريد الإلكتروني. تحقق من صندوق الوارد للتأكيد.',
'error_wrong_password': 'كلمة مرور غير صحيحة.',
'error_update_username': 'خطأ في تحديث اسم المستخدم.',
'error_update_email': 'خطأ في تحديث البريد الإلكتروني.',
'profile_error_load': 'تعذّر تحميل الملف الشخصي.'
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