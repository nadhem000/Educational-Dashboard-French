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

  // Log d'une action générale – atomically increment counter via RPC
  App.logGeneralAction = function (action, details = {}) {
    const client = getClient();
    if (!client) return;

    client
      .rpc('increment_general_action', {
        action_text: action,
        user_agent_text: navigator.userAgent
      })
      .then(({ error }) => {
        if (error) {
          // Fallback : direct upsert si le RPC échoue
          client
            .from('log-ed-french-interactions-general')
            .upsert(
              { action, count: 1, user_agent: navigator.userAgent, updated_at: new Date().toISOString() },
              { onConflict: 'action', ignoreDuplicates: false }
            )
            .then(() => {})
            .catch(() => {});
        }
      })
      .catch(() => {});
  };

  // Log d'une action utilisateur – append to user's JSONB array via RPC
  App.logUserAction = async function (action, details = {}) {
    if (!App.supabase) return;
    const { data: { user } } = await App.supabase.auth.getUser();
    if (!user) return;

    const entry = {
      action,
      details,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    App.supabase
      .rpc('append_user_action', {
        p_user_id: user.id,
        p_action_entry: entry
      })
      .then(() => {})
      .catch(() => {});
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