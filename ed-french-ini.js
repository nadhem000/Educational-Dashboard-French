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

        // Initialize all new header features
        initAuth();               // sign-in / profile toggle
        initModeToggle();        // dark/light mode icon only
        initSettingsModal();     // unchanged
        initOnlineStatus();      // green/red dot
        initInstallButton();     // keep PWA install if needed

        await loadScript('cards-building.js');
        registerSW();
    } catch (error) {
        logToDB('errors', { message: 'Fallback: ' + error.message });
    }
}

// ---------- Sign In / Profile mock ----------
function initAuth() {
    const signInBtn = document.getElementById('signInBtn');
    const profileBtn = document.getElementById('profileBtn');
    if (!signInBtn || !profileBtn) return;

    // Check saved state
    const signedIn = localStorage.getItem('mockAuth') === 'true';
    updateAuthUI(signedIn);

    signInBtn.addEventListener('click', () => {
        localStorage.setItem('mockAuth', 'true');
        updateAuthUI(true);
    });

    profileBtn.addEventListener('click', () => {
        // Sign out action
        localStorage.removeItem('mockAuth');
        updateAuthUI(false);
    });

    function updateAuthUI(isSignedIn) {
        if (isSignedIn) {
            signInBtn.style.display = 'none';
            profileBtn.style.display = 'inline-block';
        } else {
            signInBtn.style.display = 'inline-block';
            profileBtn.style.display = 'none';
        }
    }
}

// ---------- Mode toggle (icon only) ----------
function initModeToggle() {
    const body = document.body;
    const toggle = document.getElementById('modeToggle');
    if (!toggle) return;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        toggle.innerHTML = '☀️';   // sun icon for light mode
    } else {
        toggle.innerHTML = '🌙';   // moon for dark mode
    }

    toggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDark = body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggle.innerHTML = isDark ? '☀️' : '🌙';
    });
}

// ---------- Online/Offline status dot ----------
function initOnlineStatus() {
    const dot = document.getElementById('onlineStatus');
    if (!dot) return;

    function updateStatus() {
        if (navigator.onLine) {
            dot.classList.remove('offline');
            dot.title = 'Online';
        } else {
            dot.classList.add('offline');
            dot.title = 'Offline';
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus(); // initial state
}