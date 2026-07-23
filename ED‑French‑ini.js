(function() {
    'use strict';

    // ─── Thème (light/dark) ────────────────────────────
    function applyTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Appliquer le thème au chargement
    applyTheme();

    // ─── Injecter le header et le footer ───────────────
    async function injectTemplate(url, containerId, callback) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const html = await resp.text();
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
                if (callback) callback();
            }
        } catch (err) {
            console.error(`Impossible de charger ${url} :`, err);
        }
    }

    // Après insertion du header, on active le bouton paramètres et la modale
    function setupHeader() {
        const settingsBtn = document.getElementById('settingsBtn');
        const modal = document.getElementById('settingsModal');
        const closeBtn = modal ? modal.querySelector('.close-modal') : null;

        if (settingsBtn && modal) {
            settingsBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Fermer la modale en cliquant en dehors
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Ajouter un bouton pour basculer le thème (optionnel, si présent dans le header)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            // Mettre à jour l'icône selon le thème actuel
            const icon = document.getElementById('themeIcon');
            const label = document.getElementById('themeLabel');
            if (icon && label) {
                const isDark = document.body.classList.contains('dark');
                icon.textContent = isDark ? '☀️' : '🌙';
                label.textContent = isDark ? 'Mode clair' : 'Mode sombre';
            }
        }
    }

    // Chargement du header et du footer
    window.addEventListener('DOMContentLoaded', () => {
        // On suppose que des conteneurs avec les IDs 'header-container' et 'footer-container' existent dans la page
        injectTemplate('ED-French-header.html', 'header-container', setupHeader);
        injectTemplate('ED-French-footer.html', 'footer-container');
    });

    // ─── Exposer la fonction toggleTheme pour une utilisation externe ────
    window.toggleTheme = toggleTheme;
})();