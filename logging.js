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
    const msg = (error.message || error.msg || '').toLowerCase();
    return (
      msg.includes('networkerror') ||
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('network request failed') ||
      msg.includes('internet disconnected') ||
      msg.includes('fetch error')
    );
  }

  function registerSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.sync.register('sync-offline-actions').catch(() => {});
      }).catch(() => {});
    }
  }

  // Used to queue a general action when offline/network error
  async function queueGeneral(action, details) {
    try {
      await enqueueOfflineAction('general', { action, details });
      registerSync();
    } catch (e) { /* ignore */ }
  }

  // Used to queue a user action when offline/network error
  async function queueUser(action, details) {
    try {
      await enqueueOfflineAction('user', { action, details });
      registerSync();
    } catch (e) { /* ignore */ }
  }

  async function performGeneralAction(action, details = {}) {
    const client = getClient();
    if (!client) return;

    // Try RPC increment
    try {
      const { error } = await client
        .rpc('increment_general_action', {
          action_text: action,
          user_agent_text: navigator.userAgent
        });

      if (error) {
        if (isNetworkError(error)) {
          // Network issue -> queue and stop
          await queueGeneral(action, details);
          return;
        }
        // Non-network error: try fallback upsert
        try {
          const { error: upsertError } = await client
            .from('log-ed-french-interactions-general')
            .upsert(
              { action, count: 1, user_agent: navigator.userAgent, updated_at: new Date().toISOString() },
              { onConflict: 'action', ignoreDuplicates: false }
            );

          if (upsertError && isNetworkError(upsertError)) {
            await queueGeneral(action, details);
            return;
          }
        } catch (upsertException) {
          if (isOffline() || isNetworkError(upsertException)) {
            await queueGeneral(action, details);
            return;
          }
        }
      }
    } catch (e) {
      // Supabase threw an exception
      if (isOffline() || isNetworkError(e)) {
        await queueGeneral(action, details);
        return;
      }
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
      const { error } = await App.supabase
        .rpc('append_user_action', {
          p_user_id: user.id,
          p_action_entry: entry
        });

      if (error) {
        if (isNetworkError(error)) {
          await queueUser(action, details);
          return;
        }
        // If not network error, ignore for now
      }
    } catch (e) {
      if (isOffline() || isNetworkError(e)) {
        await queueUser(action, details);
        return;
      }
    }
  }

  // Public: log general action
  App.logGeneralAction = function (action, details = {}) {
    if (isOffline()) {
      queueGeneral(action, details);
      return;
    }
    performGeneralAction(action, details).catch(() => {});
  };

  // Public: log user action
  App.logUserAction = async function (action, details = {}) {
    if (isOffline()) {
      await queueUser(action, details);
      return;
    }
    try {
      await performUserAction(action, details);
    } catch (e) { /* ignore */ }
  };

  // Page visit logging
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

  // Expose for future
  App._performGeneralAction = performGeneralAction;
  App._performUserAction = performUserAction;
})();