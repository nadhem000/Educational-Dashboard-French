// logging.js – Module totalement isolé, ne modifie aucune fonction existante.
(function () {
  'use strict';

  let LOG_CLIENT = null;
  const SUPABASE_URL = 'https://bdzvznaoqqfajzuevqyz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZ6bmFvcXFmYWp6dWV2cXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODgwNTUsImV4cCI6MjEwMDc2NDA1NX0.mex6LAye9Q-QZPJutCb928Ih1IqFZ-wUbYR02Mg3Ols';

  function getClient() {
    if (!LOG_CLIENT && window.supabase && window.supabase.createClient) {
      LOG_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      });
    }
    return LOG_CLIENT;
  }

  function isOffline() {
    return !navigator.onLine;
  }

  function isNetworkError(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return (
      msg.includes('networkerror') ||
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('network request failed') ||
      msg.includes('internet disconnected')
    );
  }

  function registerSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.sync.register('sync-offline-actions').catch(() => {});
      }).catch(() => {});
    }
  }

  async function performGeneralAction(action, details = {}) {
    const client = getClient();
    if (!client) return;

    try {
      const { error } = await client
        .rpc('increment_general_action', {
          action_text: action,
          user_agent_text: navigator.userAgent
        });

      if (error) {
        // Fallback upsert
        await client
          .from('log-ed-french-interactions-general')
          .upsert(
            { action, count: 1, user_agent: navigator.userAgent, updated_at: new Date().toISOString() },
            { onConflict: 'action', ignoreDuplicates: false }
          );
      }
    } catch (e) {
      // If offline or a network failure occurred, queue for later
      if (isOffline() || isNetworkError(e)) {
        try {
          await enqueueOfflineAction('general', { action, details });
          registerSync();
        } catch (queueError) {
          // ignore queue errors
        }
      }
      throw e;
    }
  }

  async function performUserAction(action, details = {}) {
    if (!App.supabase) return;
    const { data: { user } } = await App.supabase.auth.getUser();
    if (!user) return;

    const entry = {
      action,
      details,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    try {
      await App.supabase
        .rpc('append_user_action', {
          p_user_id: user.id,
          p_action_entry: entry
        });
    } catch (e) {
      if (isOffline() || isNetworkError(e)) {
        try {
          await enqueueOfflineAction('user', { action, details });
          registerSync();
        } catch (queueError) {
          // ignore queue errors
        }
      }
      throw e;
    }
  }

  // Public: log general action
  App.logGeneralAction = function (action, details = {}) {
    if (isOffline()) {
      enqueueOfflineAction('general', { action, details })
        .then(() => registerSync())
        .catch(() => {});
      return;
    }

    performGeneralAction(action, details).catch(() => {});
  };

  // Public: log user action
  App.logUserAction = async function (action, details = {}) {
    if (isOffline()) {
      try {
        await enqueueOfflineAction('user', { action, details });
        registerSync();
      } catch (e) { /* ignore */ }
      return;
    }

    try {
      await performUserAction(action, details);
    } catch (e) { /* ignore */ }
  };

  // Page visit logging (offline-aware)
  function logPageVisit() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/') {
      App.logGeneralAction('page_visit_index', { url: window.location.href });
    } else if (path.includes('revision.html')) {
      App.logGeneralAction('page_visit_revision', { url: window.location.href });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logPageVisit);
  } else {
    logPageVisit();
  }

  // Expose replay functions for future use
  App._performGeneralAction = performGeneralAction;
  App._performUserAction = performUserAction;
})();