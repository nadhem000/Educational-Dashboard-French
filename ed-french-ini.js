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
                // Determine store based on log level
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

            const footerResp = await fetch('ed-french-footer.html');
            if (!footerResp.ok) throw new Error('Footer introuvable');
            const footerHTML = await footerResp.text();
            const footerTemp = document.createElement('div');
            footerTemp.innerHTML = footerHTML;
            body.appendChild(footerTemp.firstChild);

// ═══════════ PWA INSTALL BUTTON ═══════════
async function initInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;

    // Already installed → never show the button
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
        return;
    }

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
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
            initThemeToggle();
            initSettingsModal();
    initInstallButton();
            await loadScript('cards-building.js');

            // Register service worker (already done outside, but we keep it here for completeness)
            registerSW();
        } catch (error) {
            logToDB('errors', { message: 'Fallback: ' + error.message });
        }
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

    function initThemeToggle() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    // No longer requires the label – only needs the button and icon
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
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
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