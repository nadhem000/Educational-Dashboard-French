// ed-french-ini.js (complet avec chargement, fallback, spinner auth, install disabled)
(function() {
  const DB_NAME = 'adminMonitorDB_v2';
  const DB_VERSION = 2;
  let dbReady = false;
  let db;
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('actions'))
          db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('errors'))
          db.createObjectStore('errors', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('meta'))
          db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = (e) => { db = e.target.result; dbReady = true; resolve(db); };
      request.onerror = (e) => reject(e.target.error);
    });
  }
  async function logToDB(storeName, entry) {
    try {
      if (!dbReady) await openDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const { id, ...clean } = entry;
      await new Promise((resolve, reject) => {
        const req = store.add({ ...clean, timestamp: clean.timestamp || new Date().toISOString() });
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    } catch (e) { /* silent */ }
  }
  function injectHTML(container, htmlString, position = 'append') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
        // Only re-create scripts that have our trust marker
        if (node.hasAttribute('data-sanitize-allow')) {
          const script = document.createElement('script');
          Array.from(node.attributes).forEach(attr => {
            if (attr.name !== 'data-sanitize-allow') {
              script.setAttribute(attr.name, attr.value);
            }
          });
          script.textContent = node.textContent;
          if (position === 'prepend') {
            container.insertBefore(script, container.firstChild);
          } else {
            container.appendChild(script);
          }
        }
        // ignore scripts without the marker
      } else {
        // All other nodes are safe (DOMParser doesn't execute scripts)
        const clone = document.importNode(node, true);
        if (position === 'prepend') {
          container.insertBefore(clone, container.firstChild);
        } else {
          container.appendChild(clone);
        }
      }
    });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (!event.data) return;
      if (event.data.type === 'SW_LOG') {
        const payload = event.data.payload;
        const storeName = payload.level === 'error' ? 'errors' : 'actions';
        logToDB(storeName, { message: payload.message, source: 'sw', level: payload.level });
      } else if (event.data.type === 'SW_UPDATE') {
        showUpdateToast();
      }
    });
  }
  window.showToast = function(key, type = '', duration = 3000, isHTML = false) {
    const lang = localStorage.getItem('lang') || 'fr';
    let message = key;
    if (typeof translateToastKey === 'function') {
        message = translateToastKey(lang, key);
    }
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    if (isHTML) {
        toast.innerHTML = message;
    } else {
        toast.textContent = message;
    }
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, duration);
  };
  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  }
  // Singleton update toast
  function showUpdateToast() {
    const existing = document.querySelector('.toast.update-toast');
    if (existing) return;
    const lang = localStorage.getItem('lang') || 'fr';
    const message = typeof translateToastKey === 'function' ? translateToastKey(lang, 'toast_update_available') : '🔄 Une nouvelle version est disponible.';
    const buttonText = typeof translateToastKey === 'function' ? translateToastKey(lang, 'toast_update_button') : 'Actualiser';
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast update-toast';
    toast.innerHTML = message + ' <button id="reloadNow" class="reload-btn">' + buttonText + '</button>';
    container.appendChild(toast);
    document.getElementById('reloadNow').addEventListener('click', () => { window.location.reload(); });
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 10000);
  }
  // ---------- Focus trap & modal helpers ----------
  let currentOpenModal = null;
  let lastFocusedElement = null;
  function trapFocus(modal) {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal(modal);
        return;
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }
  function openModal(modal) {
    if (currentOpenModal && currentOpenModal !== modal) {
      closeModal(currentOpenModal);
    }
    lastFocusedElement = document.activeElement;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    currentOpenModal = modal;
    setTimeout(() => {
      const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
    }, 0);
  }
  function closeModal(modal) {
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      if (currentOpenModal === modal) currentOpenModal = null;
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }
  // ---------- Auth validation helpers ----------
  function translateError(key) {
    const lang = localStorage.getItem('lang') || 'fr';
    if (typeof translateToastKey === 'function') {
      return translateToastKey(lang, key);
    }
    // fallback
    const fallback = {
      'error_required': 'Ce champ est requis.',
      'error_invalid_email': 'Veuillez entrer une adresse email valide.',
      'error_password_short': 'Le mot de passe doit contenir au moins 6 caractères.',
      'error_password_weak': 'Mot de passe faible.'
    };
    return fallback[key] || key;
  }
  function showFieldError(input, errorSpan, messageKey) {
    if (!input || !errorSpan) return;
    input.classList.add('error');
    errorSpan.textContent = translateError(messageKey);
    errorSpan.classList.add('visible');
  }
  function clearFieldError(input, errorSpan) {
    if (!input || !errorSpan) return;
    input.classList.remove('error');
    errorSpan.textContent = '';
    errorSpan.classList.remove('visible');
  }
  // Validate a single field (returns true if valid)
  function validateField(input, errorSpan) {
    if (!input || !errorSpan) return true;
    clearFieldError(input, errorSpan);
    if (!input.value.trim()) {
      showFieldError(input, errorSpan, 'error_required');
      return false;
    }
    if (input.type === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(input.value)) {
        showFieldError(input, errorSpan, 'error_invalid_email');
        return false;
      }
    }
    if (input.id.includes('password')) {
      if (input.value.length < 6) {
        showFieldError(input, errorSpan, 'error_password_short');
        return false;
      }
      // Optional: weak password check (already displayed with strength meter)
    }
    return true;
  }
  function validateSignInForm() {
    let valid = true;
    const username = document.getElementById('signin-username');
    const email = document.getElementById('signin-email');
    const password = document.getElementById('signin-password');
    const errUser = document.getElementById('error-signin-username');
    const errEmail = document.getElementById('error-signin-email');
    const errPass = document.getElementById('error-signin-password');
    if (!validateField(username, errUser)) valid = false;
    if (!validateField(email, errEmail)) valid = false;
    if (!validateField(password, errPass)) valid = false;
    return valid;
  }
  function validateSignUpForm() {
    let valid = true;
    const username = document.getElementById('signup-username');
    const email = document.getElementById('signup-email');
    const password = document.getElementById('signup-password');
    const errUser = document.getElementById('error-signup-username');
    const errEmail = document.getElementById('error-signup-email');
    const errPass = document.getElementById('error-signup-password');
    if (!validateField(username, errUser)) valid = false;
    if (!validateField(email, errEmail)) valid = false;
    if (!validateField(password, errPass)) valid = false;
    return valid;
  }
  // Password strength meter
  function evaluatePasswordStrength(password) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar || !text) return;
    bar.className = 'strength-bar';
    if (!password) {
      bar.style.width = '0';
      text.textContent = '';
      return;
    }
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    let width, className, strengthKey;
    if (score <= 1) {
      width = '33%';
      className = 'weak';
      strengthKey = 'strength_weak';
    } else if (score <= 3) {
      width = '66%';
      className = 'medium';
      strengthKey = 'strength_medium';
    } else {
      width = '100%';
      className = 'strong';
      strengthKey = 'strength_strong';
    }
    bar.style.width = width;
    bar.className = `strength-bar ${className}`;
    text.textContent = translateError(strengthKey);
  }
  // ---------- Init functions ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  async function init() {
    try {
      const headerResp = await fetch('ed-french-header.html');
      if (!headerResp.ok) throw new Error('Header introuvable');
      const headerHTML = await headerResp.text();
      injectHTML(document.body, headerHTML, 'prepend');
      // Inject skip link as absolute first element in body
      const skipLink = document.createElement('a');
      skipLink.className = 'skip-link';
      skipLink.href = '#main-content';
      skipLink.setAttribute('data-i18n', 'skip_to_content');
      skipLink.textContent = 'Aller au contenu principal';
      document.body.insertBefore(skipLink, document.body.firstChild);
      const footerResp = await fetch('ed-french-footer.html');
      if (!footerResp.ok) throw new Error('Footer introuvable');
      const footerHTML = await footerResp.text();
      injectHTML(document.body, footerHTML, 'append');
    } catch (error) {
      logToDB('errors', { message: 'Fallback header/footer: ' + error.message });
      const fallbackHeader = document.createElement('header');
      fallbackHeader.className = 'site-header';
      fallbackHeader.innerHTML = '<div class="header-left"><span class="site-title">Educational Dashboard - French</span></div>';
      document.body.insertBefore(fallbackHeader, document.body.firstChild);
      const fallbackFooter = document.createElement('footer');
      fallbackFooter.className = 'site-footer';
      fallbackFooter.innerHTML = '<div class="footer-left"><p>Développé par Mejri Ziad – Mode dégradé</p></div>';
      document.body.appendChild(fallbackFooter);
      window.showToast('toast_fallback', 'error', 6000);
    }
    if (typeof initLangSelector === 'function') {
      initLangSelector();
    }
    initThemeToggle();
    initSettingsModal();
    initOnlineStatus();
    initAuth();
    initFooterButtons();
    initInstallButton();
    await loadScript('cards-building.js');
    registerSW();
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }
  }
  function initThemeToggle() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!toggle || !icon) return;

    function setThemeAria(isDark) {
      const key = isDark ? 'theme_switch_to_light' : 'theme_switch_to_dark';
      toggle.setAttribute('data-i18n-aria', key);
      if (typeof applyTranslations === 'function') applyTranslations();
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark');
      icon.textContent = '☀️';
      setThemeAria(true);
    }

    toggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      icon.textContent = isDark ? '☀️' : '🌙';
      setThemeAria(isDark);
    });
  }
  function initSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;
    if (!modal || !settingsBtn || !closeBtn) return;
    settingsBtn.addEventListener('click', () => openModal(modal));
    closeBtn.addEventListener('click', () => closeModal(modal));
    window.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
    trapFocus(modal);
  }
  function initOnlineStatus() {
    const dot = document.getElementById('onlineStatus');
    const banner = document.getElementById('offlineBanner');
    function update() {
      const online = navigator.onLine;
      if (dot) {
        dot.className = 'status-dot ' + (online ? 'online' : 'offline');
        const key = online ? 'online' : 'offline';
        dot.setAttribute('data-i18n-aria', key);
        dot.setAttribute('data-i18n-title', key);
      }
      if (banner) {
        if (online) {
          banner.classList.remove('show');
          document.body.classList.remove('banner-visible');
        } else {
          banner.classList.add('show');
          document.body.classList.add('banner-visible');
        }
      }
      if (typeof applyTranslations === 'function') applyTranslations();
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
  // Auth with loading spinners and validation
  function initAuth() {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const authModal = document.getElementById('authModal');
    const closeModalBtn = authModal ? authModal.querySelector('.close-modal') : null;
    const tabButtons = authModal ? authModal.querySelectorAll('.auth-tab') : [];
    const signinForm = document.getElementById('authFormSignin');
    const signupForm = document.getElementById('authFormSignup');
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    function setLoggedIn(isLoggedIn) {
      if (isLoggedIn) {
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-flex';
        profileBtn.style.display = 'inline-flex';
        localStorage.setItem('isLoggedIn', 'true');
      } else {
        signInBtn.style.display = 'inline-flex';
        signOutBtn.style.display = 'none';
        profileBtn.style.display = 'none';
        localStorage.removeItem('isLoggedIn');
      }
    }
    if (localStorage.getItem('isLoggedIn') === 'true') setLoggedIn(true);
    if (signInBtn && authModal) {
      signInBtn.addEventListener('click', () => openModal(authModal));
    }
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => closeModal(authModal));
    }
    window.addEventListener('click', (e) => {
      if (e.target === authModal) closeModal(authModal);
    });
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        if (tabName === 'signin') signinForm.classList.add('active');
        else if (tabName === 'signup') signupForm.classList.add('active');
      });
    });
    document.querySelectorAll('.toggle-password').forEach(btn => {
      const input = document.getElementById(btn.dataset.target);
      if (input) {
        // Set initial aria-label
        btn.setAttribute('aria-label', 'Afficher le mot de passe');
      }
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) {
          const isPassword = input.getAttribute('type') === 'password';
          input.setAttribute('type', isPassword ? 'text' : 'password');
          btn.textContent = isPassword ? '🙈' : '👁️';
          btn.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
        }
      });
    });
    // Real-time validation on blur
    document.getElementById('signin-username')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signin-username'));
    });
    document.getElementById('signin-email')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signin-email'));
    });
    document.getElementById('signin-password')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signin-password'));
    });
    document.getElementById('signup-username')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signup-username'));
    });
    document.getElementById('signup-email')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signup-email'));
    });
    document.getElementById('signup-password')?.addEventListener('input', function() {
      evaluatePasswordStrength(this.value);
      // Clear error on input
      clearFieldError(this, document.getElementById('error-signup-password'));
    });
    document.getElementById('signup-password')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signup-password'));
    });
    // Helper: show spinner
    function setButtonLoading(btn, isLoading) {
      if (!btn) return;
      if (isLoading) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
        const originalText = btn.getAttribute('data-original-text') || btn.textContent;
        btn.setAttribute('data-original-text', originalText);
        btn.innerHTML = '<span class="spinner"></span> ' + originalText;
      } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        const originalText = btn.getAttribute('data-original-text');
        if (originalText) {
          btn.textContent = originalText;
        }
      }
    }
    const signinSubmit = document.getElementById('signin-submit');
    if (signinSubmit) {
      signinSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateSignInForm()) return;
        setButtonLoading(signinSubmit, true);
        setTimeout(() => {
          setButtonLoading(signinSubmit, false);
          setLoggedIn(true);
          closeModal(authModal);
          document.getElementById('signin-username').value = '';
          document.getElementById('signin-email').value = '';
          document.getElementById('signin-password').value = '';
          // Clear all errors
          ['signin-username','signin-email','signin-password'].forEach(id => {
            const input = document.getElementById(id);
            const err = document.getElementById('error-' + id);
            if (input && err) clearFieldError(input, err);
          });
          window.showToast('toast_signin_success', 'success');
        }, 800);
      });
    }
    const signupSubmit = document.getElementById('signup-submit');
    if (signupSubmit) {
      signupSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateSignUpForm()) return;
        setButtonLoading(signupSubmit, true);
        setTimeout(() => {
          setButtonLoading(signupSubmit, false);
          setLoggedIn(true);
          closeModal(authModal);
          document.getElementById('signup-username').value = '';
          document.getElementById('signup-email').value = '';
          document.getElementById('signup-password').value = '';
          // Reset strength meter
          evaluatePasswordStrength('');
          // Clear errors
          ['signup-username','signup-email','signup-password'].forEach(id => {
            const input = document.getElementById(id);
            const err = document.getElementById('error-' + id);
            if (input && err) clearFieldError(input, err);
          });
          window.showToast('toast_signup_success', 'success');
        }, 800);
      });
    }
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.showToast('toast_forgot_password', '');
      });
    }
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        setLoggedIn(false);
        window.showToast('toast_signout', '');
      });
    }
    trapFocus(authModal);
  }
  async function handleBgSyncToggle(enabled) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) return;
      if (registration.active) {
        registration.active.postMessage({ type: 'SET_SYNC_ENABLED', value: enabled });
      }
      if (enabled) {
        if ('sync' in registration) {
          try { await registration.sync.register('version-check'); } catch (e) {}
        }
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
            if (status.state === 'granted') {
              await registration.periodicSync.register('version-check', { minInterval: 12 * 60 * 60 * 1000 });
            }
          } catch (e) {}
        }
      } else {
        if ('sync' in registration) {
          try {
            const tags = await registration.sync.getTags();
            if (tags.includes('version-check')) await registration.sync.unregister('version-check');
          } catch (e) {}
        }
        if ('periodicSync' in registration) {
          try {
            const tags = await registration.periodicSync.getTags();
            if (tags.includes('version-check')) await registration.periodicSync.unregister('version-check');
          } catch (e) {}
        }
      }
    } catch (err) {}
  }
  function initFooterButtons() {
    const bgSyncBtn = document.getElementById('bgSyncBtn');
    const notifBtn = document.getElementById('notifBtn');
    if (!bgSyncBtn || !notifBtn) return;
    let bgSyncEnabled = localStorage.getItem('bgSync') === 'true';
    let notifEnabled = localStorage.getItem('notifications') === 'true';
    function updateFooterButtons() {
      bgSyncBtn.setAttribute('data-i18n', bgSyncEnabled ? 'footer_disable_bg_sync' : 'footer_enable_bg_sync');
      notifBtn.setAttribute('data-i18n', notifEnabled ? 'footer_disable_notif' : 'footer_enable_notif');
      if (typeof applyTranslations === 'function') applyTranslations();
    }
    updateFooterButtons();
    if (bgSyncEnabled) handleBgSyncToggle(true);
    bgSyncBtn.addEventListener('click', () => {
      bgSyncEnabled = !bgSyncEnabled;
      localStorage.setItem('bgSync', bgSyncEnabled);
      updateFooterButtons();
      window.showToast(bgSyncEnabled ? 'toast_bg_sync_enabled' : 'toast_bg_sync_disabled', bgSyncEnabled ? 'success' : '');
      handleBgSyncToggle(bgSyncEnabled);
    });
    notifBtn.addEventListener('click', () => {
      notifEnabled = !notifEnabled;
      localStorage.setItem('notifications', notifEnabled);
      updateFooterButtons();
      window.showToast(notifEnabled ? 'toast_notif_enabled' : 'toast_notif_disabled', notifEnabled ? 'success' : '');
    });
  }
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.disabled = false;
      installBtn.style.display = 'inline-flex';
      installBtn.removeAttribute('title');
      installBtn.setAttribute('data-i18n', 'install');
      if (typeof applyTranslations === 'function') applyTranslations();
    }
  });
  async function initInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      installBtn.style.display = 'none';
      return;
    }
    installBtn.style.display = 'inline-flex';
    if (!deferredPrompt) {
      installBtn.disabled = true;
      installBtn.setAttribute('data-i18n', 'install_not_available');
      installBtn.setAttribute('title', 'Installation non disponible – utilisez le menu du navigateur');
      if (typeof applyTranslations === 'function') applyTranslations();
    }
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      }
    });
    window.addEventListener('appinstalled', () => {
      installBtn.style.display = 'none';
    });
  }
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {});
      });
    }
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Script load error'));
      document.head.appendChild(script);
    });
  }
})();