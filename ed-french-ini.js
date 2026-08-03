// ed-french-ini.js (complet avec chargement, fallback, spinner auth, install disabled) – App namespace, db-utils
(function() {
  // ──────────────────────────────────────────────────────
  // Phase 4.1 – Global console override (silent, log to DB)
  // ──────────────────────────────────────────────────────
  const originalConsole = {};
  ['log','warn','error','info','debug'].forEach(method => {
    originalConsole[method] = console[method];
    console[method] = function(...args) {
      const message = args.map(a => {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      App.logToDB(method === 'error' ? 'errors' : 'actions', {
        message,
        level: method,
        source: 'console'
      });
      // The real console is intentionally NOT called – this silences it.
    };
  });

  // ---------- Helper: inject HTML from string ----------
  function injectHTML(container, htmlString, position = 'append') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
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
      } else {
        const clone = document.importNode(node, true);
        if (position === 'prepend') {
          container.insertBefore(clone, container.firstChild);
        } else {
          container.appendChild(clone);
        }
      }
    });
  }

  // ---------- Service Worker log listener ----------
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (!event.data) return;
      if (event.data.type === 'SW_LOG') {
        const payload = event.data.payload;
        const storeName = payload.level === 'error' ? 'errors' : 'actions';
        App.logToDB(storeName, { message: payload.message, source: 'sw', level: payload.level });
      } else if (event.data.type === 'SW_UPDATE') {
        showUpdateToast();
      }
    });
  }

  // ---------- Notification history & badge ----------
  let notificationHistory = [];   // last 5 { message, type, timestamp }

  function updateNotificationBadge() {
    const bellBtn = document.getElementById('notifBellBtn');
    if (!bellBtn) return;
    const badge = bellBtn.querySelector('.bell-badge');
    if (badge) {
      badge.textContent = notificationHistory.length || '';
      badge.style.display = notificationHistory.length ? 'inline' : 'none';
    }
  }

  // ---------- Toast system (with dedup, pause-on-hover, history) ----------
  App.showToast = function(key, type = '', duration = 3000, isHTML = false) {
    const lang = localStorage.getItem('lang') || 'fr';
    let message = key;
    if (typeof App.translateToastKey === 'function') {
      message = App.translateToastKey(lang, key);
    }
    const container = document.getElementById('toast-container') || createToastContainer();

    // Dedup: skip if a toast with the same message is already visible
    const existingToasts = container.querySelectorAll('.toast');
    for (let t of existingToasts) {
      if (t.getAttribute('data-message') === message) {
        // refresh timer
        if (t._timeoutId) clearTimeout(t._timeoutId);
        t._timeoutId = setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, duration);
        return;
      }
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.setAttribute('data-message', message);
    if (isHTML) {
      toast.innerHTML = message;
    } else {
      toast.textContent = message;
    }
    container.appendChild(toast);

    // Add to notification history (max 5, dedup)
    const dupIdx = notificationHistory.findIndex(n => n.message === message);
    if (dupIdx !== -1) notificationHistory.splice(dupIdx, 1);
    notificationHistory.unshift({ message, type, timestamp: Date.now() });
    if (notificationHistory.length > 5) notificationHistory.pop();
    updateNotificationBadge();

    // Auto-remove after duration
    let timeoutId = setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);
    toast._timeoutId = timeoutId;

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      if (toast._timeoutId) clearTimeout(toast._timeoutId);
      toast._remainingTime = duration - (Date.now() - toast._startTime);
    });
    toast.addEventListener('mouseleave', () => {
      toast._startTime = Date.now();
      toast._timeoutId = setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, toast._remainingTime || duration);
    });
    toast._startTime = Date.now();
  };

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
    return container;
  }

  // Singleton update toast
  function showUpdateToast() {
    const existing = document.querySelector('.toast.update-toast');
    if (existing) return;
    const lang = localStorage.getItem('lang') || 'fr';
    const message = App.translateToastKey(lang, 'toast_update_available');
    const buttonText = App.translateToastKey(lang, 'toast_update_button');
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast update-toast';
    toast.innerHTML = message + ' <button id="reloadNow" class="reload-btn">' + buttonText + '</button>';
    container.appendChild(toast);
    document.getElementById('reloadNow').addEventListener('click', () => { window.location.reload(); });
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 10000);
  }

  // ---------- Notification panel toggle ----------
  window.toggleNotifPanel = function() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      renderNotifPanel();
    }
  };

  function renderNotifPanel() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = '';
    if (notificationHistory.length === 0) {
      list.innerHTML = '<li class="notif-empty">' + (App.getTranslation('notif_empty') || 'Aucune notification') + '</li>';
      return;
    }
    notificationHistory.forEach(n => {
      const li = document.createElement('li');
      li.className = 'notif-item';
      li.textContent = n.message;
      list.appendChild(li);
    });
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
    return App.translateToastKey(lang, key);
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
    }
    return true;
  }
  function validateSignInForm() {
    let valid = true;
    // Username is optional for Supabase sign-in; skip validation
    const email = document.getElementById('signin-email');
    const password = document.getElementById('signin-password');
    const errEmail = document.getElementById('error-signin-email');
    const errPass = document.getElementById('error-signin-password');
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
      width = '33%'; className = 'weak'; strengthKey = 'strength_weak';
    } else if (score <= 3) {
      width = '66%'; className = 'medium'; strengthKey = 'strength_medium';
    } else {
      width = '100%'; className = 'strong'; strengthKey = 'strength_strong';
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
      App.logToDB('errors', { message: 'Fallback header/footer: ' + error.message });
      const fallbackHeader = document.createElement('header');
      fallbackHeader.className = 'site-header';
      fallbackHeader.innerHTML = '<div class="header-left"><span class="site-title">Educational Dashboard - French</span></div>';
      document.body.insertBefore(fallbackHeader, document.body.firstChild);
      const fallbackFooter = document.createElement('footer');
      fallbackFooter.className = 'site-footer';
      fallbackFooter.innerHTML = '<div class="footer-left"><p>Développé par Mejri Ziad – Mode dégradé</p></div>';
      document.body.appendChild(fallbackFooter);
      App.showToast('toast_fallback', 'error', 6000);
    }
    if (typeof App.initLangSelector === 'function') {
      App.initLangSelector();
    }
    initThemeToggle();
    initSettingsModal();
    initOnlineStatus();
    initAuth();
    initFooterButtons();
    initInstallButton();
    await loadScript('cards-building.js');
    registerSW();
    App.applyTranslations();
  }
  function initThemeToggle() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!toggle || !icon) return;
    function setThemeAria(isDark) {
      const key = isDark ? 'theme_switch_to_light' : 'theme_switch_to_dark';
      toggle.setAttribute('data-i18n-aria', key);
      App.applyTranslations();
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
      App.applyTranslations();
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
  // ---------- Auth with loading spinners and validation ----------
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
      } else {
        signInBtn.style.display = 'inline-flex';
        signOutBtn.style.display = 'none';
        profileBtn.style.display = 'none';
      }
    }
    // Listen to Supabase auth state changes
    App.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Redirect to dedicated reset page, keeping the recovery token in the hash
        window.location.href = 'reset-password.html' + window.location.hash;
        return;
      }
      if (session) {
        setLoggedIn(true);
        App.logToDB('actions', { message: 'User signed in: ' + session.user.email });
      } else {
        setLoggedIn(false);
        App.logToDB('actions', { message: 'User signed out' });
      }
    });
    // Check for an existing session on page load
    App.supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
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
        // Clear general auth errors on tab switch
        const generalErrorSignin = document.getElementById('auth-error-signin');
        const generalErrorSignup = document.getElementById('auth-error-signup');
        if (generalErrorSignin) {
          generalErrorSignin.textContent = '';
          generalErrorSignin.classList.remove('visible');
        }
        if (generalErrorSignup) {
          generalErrorSignup.textContent = '';
          generalErrorSignup.classList.remove('visible');
        }
      });
    });
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.setAttribute('aria-label', 'Afficher le mot de passe');
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
      clearFieldError(this, document.getElementById('error-signup-password'));
    });
    document.getElementById('signup-password')?.addEventListener('blur', function() {
      validateField(this, document.getElementById('error-signup-password'));
    });
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
        if (originalText) btn.textContent = originalText;
      }
    }
    // Helper to translate Supabase error messages
    function translateAuthError(rawMessage) {
      const lang = localStorage.getItem('lang') || 'fr';
      const prefixKey = 'auth_error_generic';
      const prefix = App.translateToastKey(lang, prefixKey);
      // Try to translate the exact error message, else fallback to raw
      const translatedMsg = App.translateToastKey(lang, rawMessage);
      if (translatedMsg && translatedMsg !== rawMessage) {
        return prefix + translatedMsg;
      }
      return prefix + rawMessage;
    }
    // ---------- REAL SIGN IN ----------
    const signinSubmit = document.getElementById('signin-submit');
    if (signinSubmit) {
      signinSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateSignInForm()) return;
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;
        setButtonLoading(signinSubmit, true);
        const { data, error } = await App.supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        setButtonLoading(signinSubmit, false);
        if (error) {
          App.logToDB('errors', { message: 'Sign in failed: ' + error.message });
          const errorText = translateAuthError(error.message);
          const generalError = document.getElementById('auth-error-signin');
          if (generalError) {
            generalError.textContent = errorText;
            generalError.classList.add('visible');
          }
          App.showToast(errorText, 'error');
          return;
        } else {
          const generalError = document.getElementById('auth-error-signin');
          if (generalError) {
            generalError.textContent = '';
            generalError.classList.remove('visible');
          }
        }
        // Success – session listener will handle setLoggedIn
        closeModal(authModal);
        document.getElementById('signin-username').value = '';
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
        ['signin-username','signin-email','signin-password'].forEach(id => {
          const input = document.getElementById(id);
          const err = document.getElementById('error-' + id);
          if (input && err) clearFieldError(input, err);
        });
        App.showToast('toast_signin_success', 'success');
      });
    }
    // ---------- REAL SIGN UP ----------
    const signupSubmit = document.getElementById('signup-submit');
    if (signupSubmit) {
      signupSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!validateSignUpForm()) return;
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        setButtonLoading(signupSubmit, true);
        const { data, error } = await App.supabase.auth.signUp({
    email: email,
    password: password,
    options: {
        data: {
            username: username  // matches the trigger’s metadata key
        }
    }
});
        setButtonLoading(signupSubmit, false);
        if (error) {
          App.logToDB('errors', { message: 'Sign up failed: ' + error.message });
          const errorText = translateAuthError(error.message);
          const generalError = document.getElementById('auth-error-signup');
          if (generalError) {
            generalError.textContent = errorText;
            generalError.classList.add('visible');
          }
          App.showToast(errorText, 'error');
          return;
        } else {
          const generalError = document.getElementById('auth-error-signup');
          if (generalError) {
            generalError.textContent = '';
            generalError.classList.remove('visible');
          }
        }
        // If email confirmation is disabled, the user is immediately signed in.
        if (data.session) {
          // Automatically signed in – listener will update UI
          closeModal(authModal);
          document.getElementById('signup-username').value = '';
          document.getElementById('signup-email').value = '';
          document.getElementById('signup-password').value = '';
          evaluatePasswordStrength('');
          ['signup-username','signup-email','signup-password'].forEach(id => {
            const input = document.getElementById(id);
            const err = document.getElementById('error-' + id);
            if (input && err) clearFieldError(input, err);
          });
          App.showToast('toast_signup_success', 'success');
        } else {
          // Email confirmation required
          const lang = localStorage.getItem('lang') || 'fr';
          const confirmMsg = App.translateToastKey(lang, 'auth_error_confirm_email');
          App.showToast(confirmMsg, 'success', 6000);
          closeModal(authModal);
          document.getElementById('signup-username').value = '';
          document.getElementById('signup-email').value = '';
          document.getElementById('signup-password').value = '';
          evaluatePasswordStrength('');
          ['signup-username','signup-email','signup-password'].forEach(id => {
            const input = document.getElementById(id);
            const err = document.getElementById('error-' + id);
            if (input && err) clearFieldError(input, err);
          });
        }
      });
    }
    // ---------- FORGOT PASSWORD ----------
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const lang = localStorage.getItem('lang') || 'fr';
        const email = document.getElementById('signin-email')?.value.trim();
        if (!email) {
          const msg = App.translateToastKey(lang, 'auth_error_email_required');
          App.showToast(msg, 'error');
          return;
        }
        const { error } = await App.supabase.auth.resetPasswordForEmail(email);
        if (error) {
          const errorText = translateAuthError(error.message);
          App.showToast(errorText, 'error');
        } else {
          const msg = App.translateToastKey(lang, 'auth_error_reset_sent');
          App.showToast(msg, 'success', 5000);
        }
      });
    }
    // ---------- REAL SIGN OUT ----------
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        await App.supabase.auth.signOut();
        // Listener will handle UI update and logging
        App.showToast('toast_signout', '');
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
    function updateFooterTexts() {
      if (bgSyncBtn) {
        bgSyncBtn.textContent = App.getTranslation(bgSyncEnabled ? 'footer_disable_bg_sync' : 'footer_enable_bg_sync');
      }
      if (notifBtn) {
        notifBtn.textContent = App.getTranslation(notifEnabled ? 'footer_disable_notif' : 'footer_enable_notif');
      }
    }
    updateFooterTexts();
    // When language changes, refresh the button texts
    App.onLangChange(() => updateFooterTexts());
    if (bgSyncEnabled) handleBgSyncToggle(true);
    bgSyncBtn.addEventListener('click', () => {
      bgSyncEnabled = !bgSyncEnabled;
      localStorage.setItem('bgSync', bgSyncEnabled);
      updateFooterTexts();
      App.showToast(bgSyncEnabled ? 'toast_bg_sync_enabled' : 'toast_bg_sync_disabled', bgSyncEnabled ? 'success' : '');
      handleBgSyncToggle(bgSyncEnabled);
    });
    notifBtn.addEventListener('click', () => {
      notifEnabled = !notifEnabled;
      localStorage.setItem('notifications', notifEnabled);
      updateFooterTexts();
      App.showToast(notifEnabled ? 'toast_notif_enabled' : 'toast_notif_disabled', notifEnabled ? 'success' : '');
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
      App.applyTranslations();
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
      App.applyTranslations();
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

// ─── Network interceptor (captures fetch & XHR, broadcasts to monitor) ───
(function() {
  const CHANNEL_NAME = 'app-monitor';

  function broadcastLog(level, message, source = 'network') {
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({
        type: 'log-entry',
        payload: {
          level,
          message,
          source,
          timestamp: new Date().toISOString()
        }
      });
      setTimeout(() => bc.close(), 100);
    } catch(e) {}
  }

  // Wrap fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    const method = (options && options.method) || 'GET';
    const start = Date.now();

    broadcastLog('network', `⏳ ${method} ${url}`);

    return originalFetch.apply(this, args)
      .then(response => {
        const duration = Date.now() - start;
        broadcastLog('network', `✅ ${method} ${url} → ${response.status} (${duration}ms)`);
        return response;
      })
      .catch(error => {
        broadcastLog('network', `❌ ${method} ${url} → ${error.message}`);
        throw error;
      });
  };

  // Optional: wrap XMLHttpRequest (for older libraries)
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let method, url;
    const open = xhr.open;
    xhr.open = function(m, u, ...rest) {
      method = m;
      url = u;
      return open.apply(xhr, [m, u, ...rest]);
    };
    const send = xhr.send;
    xhr.send = function(...sargs) {
      broadcastLog('network', `⏳ XHR ${method} ${url}`);
      xhr.addEventListener('loadend', function() {
        if (xhr.status) {
          broadcastLog('network', `✅ XHR ${method} ${url} → ${xhr.status}`);
        } else {
          broadcastLog('network', `❌ XHR ${method} ${url} → Network error`);
        }
      });
      return send.apply(xhr, sargs);
    };
    return xhr;
  };
})();