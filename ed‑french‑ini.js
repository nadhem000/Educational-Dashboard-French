(function() {
    // S'assurer que le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        try {
            // Injection de l'en-tête
            const headerResp = await fetch('ed-french-header.html');
            if (!headerResp.ok) throw new Error('Header introuvable');
            const headerHTML = await headerResp.text();
            const body = document.body;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = headerHTML;
            // Déplacer tous les nœuds au début du body
            while (tempDiv.firstChild) {
                body.insertBefore(tempDiv.firstChild, body.firstChild);
            }

            // Injection du pied de page
            const footerResp = await fetch('ed-french-footer.html');
            if (!footerResp.ok) throw new Error('Footer introuvable');
            const footerHTML = await footerResp.text();
            const footerTemp = document.createElement('div');
            footerTemp.innerHTML = footerHTML;
            body.appendChild(footerTemp.firstChild);

            // Initialiser les fonctionnalités de l'en-tête
            initThemeToggle();
            initSettingsModal();

            // Charger dynamiquement le script de construction des cartes
            await loadScript('ED-French-cards-building.js');
        } catch (error) {
            console.warn('Impossible de charger l’en-tête ou le pied de page, utilisation du fallback :', error);
            // Fallback minimal éventuel
        }
    }

    function initThemeToggle() {
        const body = document.body;
        const toggle = document.getElementById('themeToggle');
        const icon = document.getElementById('themeIcon');
        const label = document.getElementById('themeLabel');
        if (!toggle || !icon || !label) return;

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark');
            icon.textContent = '☀️';
            label.textContent = 'Mode clair';
        }

        toggle.addEventListener('click', () => {
            body.classList.toggle('dark');
            const isDark = body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            icon.textContent = isDark ? '☀️' : '🌙';
            label.textContent = isDark ? 'Mode clair' : 'Mode sombre';
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
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
})();