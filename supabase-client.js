// supabase-client.js – Supabase client initialization
(function() {
  const SUPABASE_URL = 'https://bdzvznaoqqfajzuevqyz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZ6bmFvcXFmYWp6dWV2cXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODgwNTUsImV4cCI6MjEwMDc2NDA1NX0.mex6LAye9Q-QZPJutCb928Ih1IqFZ-wUbYR02Mg3Ols';
  // 'supabase' is the global from the CDN script
  const { createClient } = supabase;
  App.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();