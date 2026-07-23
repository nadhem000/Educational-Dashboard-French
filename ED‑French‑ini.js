(function() {
    'use strict';

    async function fetchAndInject(url, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`Status ${resp.status}`);
            const html = await resp.text();
            container.innerHTML = html;
        } catch (err) {
            console.warn(`Impossible de charger ${url}`, err);
            // Ultimate fallback: if fetch fails, show a minimal placeholder
            if (containerId === 'header-container') {
                container.innerHTML = '<header class="site-header"><div class="header-col header-col--left"><img src="icon-96x96.png" alt="Logo" width="32" height="32" class="header-icon"></div><div class="header-col header-col--center"><span class="site-title">Educational Dashboard<br>French Hub</span></div><div class="header-col header-col--right"><button id="settingsBtn" class="settings-btn" title="Paramètres">⚙️</button></div></header><div id="settingsModal" class="modal"><div class="modal-content"><span class="close-modal">&times;</span><p>⚙️ Paramètres – Bientôt disponible</p></div></div>';
            } else if (containerId === 'footer-container') {
                container.innerHTML = '<footer class="site-footer"><div class="footer-col footer-col--left"><p>Développé par <strong>Mejri Ziad</strong><br>Hébergé sur GitHub &amp; Netlify</p></div><div class="footer-col footer-col--center"><a href="#">Contact</a> &nbsp;|&nbsp;<a href="#">Politique de confidentialité</a> &nbsp;|&nbsp;<a href="#">Conditions d’utilisation</a></div><div class="footer-col footer-col--right"><p class="version">Version 0.0.1</p></div></footer>';
            }
        }
    }

    function setupModal() {
        const modal = document.getElementById('settingsModal');
        const btn = document.getElementById('settingsBtn');
        if (!modal || !btn) return;
        btn.addEventListener('click', () => { modal.style.display = 'block'; });
        modal.querySelector('.close-modal').addEventListener('click', () => { modal.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    function applyTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
        }
    }

    async function init() {
        await Promise.all([
            fetchAndInject('ED-French-header.html', 'header-container'),
            fetchAndInject('ED-French-footer.html', 'footer-container')
        ]);
        setupModal();
        applyTheme();
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();