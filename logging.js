// logging.js – Module totalement isolé, ne modifie aucune fonction existante.
(function () {
  'use strict';

  // Utilise un client Supabase séparé pour éviter de perturber l'instance principale.
  let LOG_CLIENT = null;
  const SUPABASE_URL = 'https://bdzvznaoqqfajzuevqyz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZ6bmFvcXFmYWp6dWV2cXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODgwNTUsImV4cCI6MjEwMDc2NDA1NX0.mex6LAye9Q-QZPJutCb928Ih1IqFZ-wUbYR02Mg3Ols';

  // Initialisation paresseuse du client (attendre que la lib supabase soit chargée)
  function getClient() {
    if (!LOG_CLIENT && window.supabase && window.supabase.createClient) {
      LOG_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        // Désactiver la persistance de session pour ce client (ne pas interférer avec l'auth principale)
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      });
    }
    return LOG_CLIENT;
  }

  // Envoi asynchrone et silencieux (fire‑and‑forget)
  function safeInsert(table, payload) {
    const client = getClient();
    if (!client) return; // Supabase pas encore chargé, on abandonne proprement

    // Le timeout évite de bloquer l'appel si le réseau est lent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    client
      .from(table)
      .insert([payload], { count: null })
      .abortSignal(controller.signal)
      .then(({ error }) => {
        if (error) {
          // Erreur silencieuse – on peut si on veut la renvoyer vers IndexedDB plus tard
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));
  }

  // Log d'une action générale (sans utilisateur)
  App.logGeneralAction = function (action, details = {}) {
    const payload = {
      action: action,
      details: details,
      user_agent: navigator.userAgent
    };
    safeInsert('log-ed-french-interactions-general', payload);
  };

  // Log d'une action utilisateur (signé)
  App.logUserAction = async function (action, details = {}) {
    // Vérifier que l'utilisateur est bien connecté
    const { data: { user } } = await App.supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      action: action,
      details: details,
      user_agent: navigator.userAgent
    };
    safeInsert('log-ed-french-interactions-backup', payload);
  };

  // Appel automatique au chargement de la page (selon le nom de la page)
  function logPageVisit() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/') {
      App.logGeneralAction('page_visit_index', { url: window.location.href });
    } else if (path.includes('revision.html')) {
      App.logGeneralAction('page_visit_revision', { url: window.location.href });
    } else if (path.includes('profile.html')) {
      // L'action profil sera logguée comme action utilisateur plus bas
    }
  }

  // Exécution après que le DOM et les scripts essentiels soient prêts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logPageVisit);
  } else {
    logPageVisit();
  }
})();