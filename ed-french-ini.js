// ed-french-ini.js (complet avec exécution des scripts injectés et toasts traduits)
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
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    const nodes = Array.from(temp.childNodes);
    nodes.forEach(node => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from(node.attributes).forEach(attr => {
          script.setAttribute(attr.name, attr.value);
        });
        script.textContent = node.textContent;
        if (position === 'prepend') {
          container.insertBefore(script, container.firstChild);
        } else {
          container.appendChild(script);
        }
      } else {
        if (position === 'prepend') {
          container.insertBefore(node, container.firstChild);
        } else {
          container.appendChild(node);
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
  function showUpdateToast() {
    const lang = localStorage.getItem('lang') || 'fr';
    const message = typeof translateToastKey === 'function' ? translateToastKey(lang, 'toast_update_available') : '🔄 Une nouvelle version est disponible.';
    const buttonText = typeof translateToastKey === 'function' ? translateToastKey(lang, 'toast_update_button') : 'Actualiser';
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message + ' <button id="reloadNow" class="reload-btn">' + buttonText + '</button>';
    container.appendChild(toast);
    document.getElementById('reloadNow').addEventListener('click', () => { window.location.reload(); });
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 10000);
  }
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
      const footerResp = await fetch('ed-french-footer.html');
      if (!footerResp.ok) throw new Error('Footer introuvable');
      const footerHTML = await footerResp.text();
      injectHTML(document.body, footerHTML, 'append');
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
    } catch (error) {
      logToDB('errors', { message: 'Fallback: ' + error.message });
    }
  }
  function initThemeToggle() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!toggle || !icon) return;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark');
      icon.textContent = '☀️';
    }
    toggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      icon.textContent = isDark ? '☀️' : '🌙';
    });
  }
  function initSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;
    if (!modal || !settingsBtn || !closeBtn) return;
    settingsBtn.onclick = () => modal.style.display = 'block';
    closeBtn.onclick = () => modal.style.display = 'none';
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }
  function initOnlineStatus() {
    const dot = document.getElementById('onlineStatus');
    if (!dot) return;
    function update() {
      const online = navigator.onLine;
      dot.className = 'status-dot ' + (online ? 'online' : 'offline');
      dot.setAttribute('data-i18n-title', online ? 'online' : 'offline');
      if (typeof applyTranslations === 'function') applyTranslations();
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
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
    if (signInBtn && authModal) signInBtn.addEventListener('click', () => { authModal.style.display = 'block'; });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { authModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === authModal) authModal.style.display = 'none'; });
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
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) {
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          btn.textContent = type === 'password' ? '👁️' : '🙈';
        }
      });
    });
    const signinSubmit = document.getElementById('signin-submit');
    if (signinSubmit) {
      signinSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        setLoggedIn(true);
        authModal.style.display = 'none';
        document.getElementById('signin-username').value = '';
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
        window.showToast('toast_signin_success', 'success');
      });
    }
    const signupSubmit = document.getElementById('signup-submit');
    if (signupSubmit) {
      signupSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        setLoggedIn(true);
        authModal.style.display = 'none';
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        window.showToast('toast_signup_success', 'success');
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
          try {
            await registration.sync.register('version-check');
            console.log('Background sync registered (version-check)');
          } catch (e) {
            console.warn('Background sync registration failed:', e);
          }
        }
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
            if (status.state === 'granted') {
              await registration.periodicSync.register('version-check', {
                minInterval: 12 * 60 * 60 * 1000
              });
              console.log('Periodic background sync registered (version-check)');
            } else {
              console.log('Periodic background sync permission not granted; it may be enabled later automatically.');
            }
          } catch (e) {
            console.warn('Periodic background sync registration failed:', e);
          }
        }
      } else {
        if ('sync' in registration) {
          try {
            const tags = await registration.sync.getTags();
            if (tags.includes('version-check')) {
              await registration.sync.unregister('version-check');
              console.log('Background sync unregistered');
            }
          } catch (e) {
            console.warn('Error unregistering sync:', e);
          }
        }
        if ('periodicSync' in registration) {
          try {
            const tags = await registration.periodicSync.getTags();
            if (tags.includes('version-check')) {
              await registration.periodicSync.unregister('version-check');
              console.log('Periodic background sync unregistered');
            }
          } catch (e) {
            console.warn('Error unregistering periodic sync:', e);
          }
        }
      }
    } catch (err) {
      console.error('handleBgSyncToggle error:', err);
    }
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
    if (bgSyncEnabled) {
      handleBgSyncToggle(true);
    }
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

  // ═══════════════════════════════════════
  //  INSTALL BUTTON – fixed version
  // ═══════════════════════════════════════
  let deferredPrompt;

  // Listen for the install prompt as soon as possible
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
    logToDB('actions', { message: 'beforeinstallprompt fired', type: 'pwa' });
  });

  async function initInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;

    // Already installed as standalone? Hide permanently
    if (window.matchMedia('(display-mode: standalone)').matches) {
      installBtn.style.display = 'none';
      return;
    }

    // If the prompt already fired, show button immediately
    if (deferredPrompt) {
      installBtn.style.display = 'inline-flex';
    }

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        logToDB('actions', { message: `Install prompt outcome: ${outcome}`, type: 'pwa' });
        if (outcome === 'accepted') {
          installBtn.style.display = 'none';
          logToDB('actions', { message: 'User accepted install', type: 'pwa' });
        }
        deferredPrompt = null;
      } else {
        // Should not normally happen if button is only shown after beforeinstallprompt
        window.showToast('toast_install_prompt', '', 5000);
      }
    });

    window.addEventListener('appinstalled', () => {
      installBtn.style.display = 'none';
      logToDB('actions', { message: 'App installed', type: 'pwa' });
    });
  }
  // ═══════════════════════════════════════

  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            logToDB('actions', { message: 'Service Worker registered: ' + registration.scope, type: 'sw_reg' });
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                }
              });
            });
          })
          .catch(error => { logToDB('errors', { message: 'SW registration failed: ' + error.message }); });
      });
    }
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        logToDB('errors', { message: 'Failed to load script: ' + src });
        reject(new Error('Script load error'));
      };
      document.head.appendChild(script);
    });
  }
})();