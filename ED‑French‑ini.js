(function() {
    'use strict';

    // ─── Styles CSS nécessaires ─────────────────────────────
    const styles = `
    /* Nouveau header */
    .site-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.6rem 1.5rem;
        background: var(--card, #ffffff);
        border-bottom: 1px solid var(--border, #e5ddd0);
        box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.05));
        position: sticky;
        top: 0;
        z-index: 20;
    }
    .header-left {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    .header-icon {
        border-radius: 6px;
    }
    .site-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--heading, #382e1e);
    }
    .header-right {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }
    .theme-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.45rem 0.9rem;
        border-radius: 20px;
        border: 1px solid var(--border, #e5ddd0);
        background: var(--button-bg, #f0e8d8);
        color: var(--text, #2b2416);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.25s;
    }
    .theme-btn:hover {
        background: var(--button-hover, #e3d5bc);
    }
    .settings-btn {
        background: none;
        border: 1px solid var(--border, #e5ddd0);
        font-size: 1.3rem;
        cursor: pointer;
        padding: 0.3rem 0.7rem;
        border-radius: 8px;
        transition: background 0.25s;
        color: var(--text, #2b2416);
        background: var(--button-bg, #f0e8d8);
    }
    .settings-btn:hover {
        background: var(--button-hover, #e3d5bc);
    }

    /* Modale */
    .modal {
        display: none;
        position: fixed;
        z-index: 100;
        left: 0; top: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
    }
    .modal-content {
        background: var(--card, #ffffff);
        color: var(--text, #2b2416);
        margin: 15% auto;
        padding: 1.5rem;
        border-radius: 12px;
        width: 80%;
        max-width: 400px;
        text-align: center;
        position: relative;
    }
    .close-modal {
        position: absolute;
        top: 8px;
        right: 16px;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-light, #5c5344);
    }

    /* Footer */
    .site-footer {
        text-align: center;
        padding: 1.5rem;
        background: var(--card, #ffffff);
        border-top: 1px solid var(--border, #e5ddd0);
        color: var(--text-light, #5c5344);
        font-size: 0.85rem;
    }
    .site-footer a {
        color: var(--accent, #c75b2c);
        text-decoration: none;
    }
    .site-footer a:hover {
        text-decoration: underline;
    }
    .version {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        opacity: 0.7;
    }
    `;

    // ─── Construction du header ─────────────────────────────
    function buildHeader() {
        const topbar = document.querySelector('.topbar');
        if (!topbar) return;

        // Remplacer le contenu de la topbar par notre header complet
        topbar.innerHTML = `
            <div class="header-left">
                <img src="icon-96x96.png" alt="Logo" width="32" height="32" class="header-icon">
                <span class="site-title">Révisions Tunisie</span>
            </div>
            <div class="header-right">
                <button id="themeToggle" class="theme-btn">
                    <span id="themeIcon">🌙</span> <span id="themeLabel">Mode sombre</span>
                </button>
                <button id="settingsBtn" class="settings-btn" title="Paramètres">⚙️</button>
            </div>
        `;

        // Ajouter la modale dans le body
        const modalHTML = `
        <div id="settingsModal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <p>⚙️ Paramètres – Bientôt disponible</p>
            </div>
        </div>`;
        topbar.insertAdjacentHTML('afterend', modalHTML);
    }

    // ─── Footer ─────────────────────────────────────────────
    function buildFooter() {
        const container = document.getElementById('footer-container');
        if (!container) return;
        container.innerHTML = `
            <footer class="site-footer">
                <p>Développé par <strong>Mejri Ziad</strong><br>Hébergé sur GitHub &amp; Netlify</p>
                <div class="footer-links">
                    <a href="#">Contact</a> &nbsp;|&nbsp;
                    <a href="#">Politique de confidentialité</a> &nbsp;|&nbsp;
                    <a href="#">Conditions d’utilisation</a>
                </div>
                <p class="version">Version 0.0.1</p>
            </footer>
        `;
    }

    // ─── Appliquer le thème sauvegardé ──────────────────────
    function applySavedTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        // Mettre à jour l'icône du bouton si déjà présent
        const icon = document.getElementById('themeIcon');
        const label = document.getElementById('themeLabel');
        if (icon && label) {
            const isDark = document.body.classList.contains('dark');
            icon.textContent = isDark ? '☀️' : '🌙';
            label.textContent = isDark ? 'Mode clair' : 'Mode sombre';
        }
    }

    // ─── Activer la modale paramètres ───────────────────────
    function setupModal() {
        const modal = document.getElementById('settingsModal');
        const btn = document.getElementById('settingsBtn');
        if (!modal || !btn) return;
        const closeBtn = modal.querySelector('.close-modal');

        btn.addEventListener('click', () => { modal.style.display = 'block'; });
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // ─── Exécution immédiate (avant le script inline) ──────
    function init() {
        // Injecter le CSS
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Construire le header (remplace la topbar)
        buildHeader();

        // Appliquer le thème sauvegardé immédiatement après construction du header
        applySavedTheme();

        // Construire le footer
        buildFooter();

        // Activer la modale
        setupModal();
    }

    // Lancer l'initialisation tout de suite (le DOM est déjà parsé à ce stade)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
