(function() {
    'use strict';

    // CSS (injected into the page)
    var styles = '.site-header{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 1.5rem;background:var(--card,#fff);border-bottom:1px solid var(--border,#e5ddd0);box-shadow:0 1px 3px rgba(0,0,0,0.05)}.header-left{display:flex;align-items:center;gap:0.6rem}.header-icon{border-radius:6px}.site-title{font-weight:700;font-size:1.1rem;color:var(--heading,#382e1e)}.settings-btn{background:var(--button-bg,#f0e8d8);border:1px solid var(--border,#e5ddd0);font-size:1.3rem;cursor:pointer;padding:0.3rem 0.7rem;border-radius:8px;color:var(--text,#2b2416)}.settings-btn:hover{background:var(--button-hover,#e3d5bc)}.modal{display:none;position:fixed;z-index:100;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5)}.modal-content{background:var(--card,#fff);color:var(--text,#2b2416);margin:15% auto;padding:1.5rem;border-radius:12px;width:80%;max-width:400px;text-align:center;position:relative}.close-modal{position:absolute;top:8px;right:16px;font-size:1.5rem;cursor:pointer;color:var(--text-light,#5c5344)}.site-footer{text-align:center;padding:1.5rem;background:var(--card,#fff);border-top:1px solid var(--border,#e5ddd0);color:var(--text-light,#5c5344);font-size:0.85rem;margin-top:2rem}.site-footer a{color:var(--accent,#c75b2c);text-decoration:none}.site-footer a:hover{text-decoration:underline}.version{margin-top:0.5rem;font-size:0.75rem;opacity:0.7}';

    // Header HTML
    var headerHTML = '<header class="site-header"><div class="header-left"><img src="icon-96x96.png" alt="Logo" width="32" height="32" class="header-icon"><span class="site-title">Révisions Tunisie</span></div><button id="settingsBtn" class="settings-btn" title="Paramètres">⚙️</button></header><div id="settingsModal" class="modal"><div class="modal-content"><span class="close-modal">&times;</span><p>⚙️ Paramètres – Bientôt disponible</p></div></div>';

    // Footer HTML
    var footerHTML = '<footer class="site-footer"><p>Développé par <strong>Mejri Ziad</strong><br>Hébergé sur GitHub &amp; Netlify</p><div class="footer-links"><a href="#">Contact</a> &nbsp;|&nbsp;<a href="#">Politique de confidentialité</a> &nbsp;|&nbsp;<a href="#">Conditions d’utilisation</a></div><p class="version">Version 0.0.1</p></footer>';

    // Apply saved theme
    function applyTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
        }
    }

    // Setup settings modal
    function setupModal() {
        var modal = document.getElementById('settingsModal');
        var btn = document.getElementById('settingsBtn');
        if (!modal || !btn) return;
        btn.addEventListener('click', function() { modal.style.display = 'block'; });
        modal.querySelector('.close-modal').addEventListener('click', function() { modal.style.display = 'none'; });
        window.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
    }

    // Inject all
    function inject() {
        // Add styles
        var styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Header
        var headerContainer = document.getElementById('header-container');
        if (headerContainer) headerContainer.innerHTML = headerHTML;

        // Footer
        var footerContainer = document.getElementById('footer-container');
        if (footerContainer) footerContainer.innerHTML = footerHTML;

        applyTheme();
        setupModal();
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
