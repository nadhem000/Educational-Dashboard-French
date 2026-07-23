(function() {
    'use strict';

    /* ── Styles for injected elements ── */
    const styles = `
    .site-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0.6rem 1.5rem;
        background: var(--card, #ffffff);
        border-bottom: 1px solid var(--border, #e5ddd0);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-left {
        display: flex; align-items: center; gap: 0.6rem;
    }
    .header-icon {
        border-radius: 6px;
    }
    .site-title {
        font-weight: 700; font-size: 1.1rem;
        color: var(--heading, #382e1e);
    }
    .settings-btn {
        background: var(--button-bg, #f0e8d8);
        border: 1px solid var(--border, #e5ddd0);
        font-size: 1.3rem; cursor: pointer;
        padding: 0.3rem 0.7rem; border-radius: 8px;
        color: var(--text, #2b2416);
    }
    .settings-btn:hover { background: var(--button-hover, #e3d5bc); }

    .modal {
        display: none; position: fixed; z-index: 100;
        left: 0; top: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
    }
    .modal-content {
        background: var(--card, #ffffff); color: var(--text, #2b2416);
        margin: 15% auto; padding: 1.5rem; border-radius: 12px;
        width: 80%; max-width: 400px; text-align: center; position: relative;
    }
    .close-modal {
        position: absolute; top: 8px; right: 16px;
        font-size: 1.5rem; cursor: pointer;
        color: var(--text-light, #5c5344);
    }

    .site-footer {
        text-align: center; padding: 1.5rem;
        background: var(--card, #ffffff);
        border-top: 1px solid var(--border, #e5ddd0);
        color: var(--text-light, #5c5344);
        font-size: 0.85rem; margin-top: 2rem;
    }
    .site-footer a {
        color: var(--accent, #c75b2c); text-decoration: none;
    }
    .site-footer a:hover { text-decoration: underline; }
    .version { margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7; }
    `;

    /* ── Fetch HTML file and return text ── */
    async function fetchHTML(url) {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Impossible de charger ${url} (status ${resp.status})`);
        return resp.text();
    }

    /* ── Setup settings modal after injection ── */
    function setupModal() {
        const modal = document.getElementById('settingsModal');
        const btn = document.getElementById('settingsBtn');
        if (!modal || !btn) return;
        btn.addEventListener('click', () => { modal.style.display = 'block'; });
        modal.querySelector('.close-modal').addEventListener('click', () => { modal.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    /* ── Apply saved theme (dark/light) ── */
    function applyTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
        }
    }

    /* ── Main injection function ── */
    async function injectAll() {
        // Add stylesheet
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Inject header
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            try {
                const headerHTML = await fetchHTML('ED-French-header.html');
                headerContainer.innerHTML = headerHTML;
            } catch (e) {
                console.warn(e.message);
            }
        }

        // Inject footer
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            try {
                const footerHTML = await fetchHTML('ED-French-footer.html');
                footerContainer.innerHTML = footerHTML;
            } catch (e) {
                console.warn(e.message);
            }
        }

        setupModal();
        applyTheme();
    }

    // Run after DOM is fully parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAll);
    } else {
        injectAll();
    }
})();