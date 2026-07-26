// ed-french-ini.js
(function() {
    // ═══════════════ MINI LOGGER (writes to testing DB) ═══════════════
    const DB_NAME = 'adminMonitorDB_v2';
    const DB_VERSION = 1;
    let dbReady = false;
    let db;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('actions')) db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('errors')) db.createObjectStore('errors', { keyPath: 'id', autoIncrement: true });
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

    // ═══════════ Service Worker message handler ═══════════
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_LOG') {
                const payload = event.data.payload;
                const storeName = payload.level === 'error' ? 'errors' : 'actions';
                logToDB(storeName, { message: payload.message, source: 'sw', level: payload.level });
            }
        });
    }

    // ═══════════ MAIN INIT ═══════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        try {
            // Fetch and inject header
            const headerResp = await fetch('ed-french-header.html');
            if (!headerResp.ok) throw new Error('Header introuvable');
            const headerHTML = await headerResp.text();
            const body = document.body;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = headerHTML;
            const firstBodyChild = body.firstChild;
            while (tempDiv.firstChild) {
                body.insertBefore(tempDiv.firstChild, firstBodyChild);
            }

            // Fetch and inject footer
            const footerResp = await fetch('ed-french-footer.html');
            if (!footerResp.ok) throw new Error('Footer introuvable');
            const footerHTML = await footerResp.text();
            const footerTemp = document.createElement('div');
            footerTemp.innerHTML = footerHTML;
            body.appendChild(footerTemp.firstChild);

            // Initialise all header-dependent features
            initThemeToggle();
            initSettingsModal();
            initOnlineStatus();
            initAuth();               // 👈 new auth modal & button logic
            initInstallButton();

            await loadScript('cards-building.js');
            registerSW();
        } catch (error) {
            logToDB('errors', { message: 'Fallback: ' + error.message });
        }
    }

    // ── Theme toggle (icon only, no label) ──
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

    // ── Settings modal ──
    function initSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeBtn = modal ? modal.querySelector('.close-modal') : null;
        if (!modal || !settingsBtn || !closeBtn) return;
        settingsBtn.onclick = () => modal.style.display = 'block';
        closeBtn.onclick = () => modal.style.display = 'none';
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // ── Online/Offline dot updater ──
    function initOnlineStatus() {
        const dot = document.getElementById('onlineStatus');
        if (!dot) return;
        function update() {
            const online = navigator.onLine;
            dot.className = 'status-dot ' + (online ? 'online' : 'offline');
            dot.title = online ? 'En ligne' : 'Hors ligne';
        }
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    }

    // ── Mock Auth (modal, sign in/up, button swapping) ──
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

        // Helper to update header buttons based on login state
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

        // Initial state from localStorage
        if (localStorage.getItem('isLoggedIn') === 'true') {
            setLoggedIn(true);
        }

        // Open modal when 'Connexion' clicked
        if (signInBtn && authModal) {
            signInBtn.addEventListener('click', () => {
                authModal.style.display = 'block';
            });
        }

        // Close modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                authModal.style.display = 'none';
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
        });

        // Tab switching
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                // Update active tab
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Show corresponding form
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                if (tabName === 'signin') signinForm.classList.add('active');
                else if (tabName === 'signup') signupForm.classList.add('active');
            });
        });

        // Password visibility toggle (works for both forms)
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    // change icon
                    btn.textContent = type === 'password' ? '👁️' : '🙈';
                }
            });
        });

        // Sign In mock
        const signinSubmit = document.getElementById('signin-submit');
        if (signinSubmit) {
            signinSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                // Accept any values – mock success
                setLoggedIn(true);
                authModal.style.display = 'none';
                // Clear form (optional)
                document.getElementById('signin-username').value = '';
                document.getElementById('signin-email').value = '';
                document.getElementById('signin-password').value = '';
            });
        }

        // Sign Up mock
        const signupSubmit = document.getElementById('signup-submit');
        if (signupSubmit) {
            signupSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                setLoggedIn(true);
                authModal.style.display = 'none';
                document.getElementById('signup-username').value = '';
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
            });
        }

        // Forgot password mock
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Fonctionnalité à venir – Mot de passe oublié.');
            });
        }

        // Sign out
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                setLoggedIn(false);
            });
        }
    }

    // ── PWA Install prompt (button hidden if not needed) ──
    async function initInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (!installBtn) return;
        if (window.matchMedia('(display-mode: standalone)').matches) {
            installBtn.style.display = 'none';
            return;
        }
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'inline-block';
            logToDB('actions', { message: 'beforeinstallprompt fired – install button shown', type: 'pwa' });
        });
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            logToDB('actions', { message: `Install prompt outcome: ${outcome}`, type: 'pwa' });
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
                logToDB('actions', { message: 'User accepted install', type: 'pwa' });
            }
            deferredPrompt = null;
        });
        window.addEventListener('appinstalled', () => {
            installBtn.style.display = 'none';
            logToDB('actions', { message: 'App installed successfully', type: 'pwa' });
        });
    }

    function registerSW() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        logToDB('actions', { message: 'Service Worker registered with scope: ' + registration.scope, type: 'sw_reg' });
                    })
                    .catch(error => {
                        logToDB('errors', { message: 'Service Worker registration failed: ' + error.message });
                    });
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