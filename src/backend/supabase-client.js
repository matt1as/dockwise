import { createClient } from '../../node_modules/@supabase/supabase-js/dist/index.mjs';

export function createSupabaseBackend(env = import.meta.env) {
  const url = env?.VITE_SUPABASE_URL;
  const anonKey = env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      configured: false,
      client: null,
      async getUser() { return null; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async signUp() { return { data: null, error: new Error('Supabase is not configured') }; },
      async signIn() { return { data: null, error: new Error('Supabase is not configured') }; },
      async signOut() { return { error: null }; },
      async loadProgress() { return { data: [], error: null }; },
      async saveProgress() { return { error: null }; },
    };
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  return {
    configured: true,
    client,
    async getUser() {
      const { data, error } = await client.auth.getUser();
      if (error) return null;
      return data.user;
    },
    onAuthStateChange(callback) {
      return client.auth.onAuthStateChange(callback);
    },
    async signUp(email, password) {
      return client.auth.signUp({ email, password });
    },
    async signIn(email, password) {
      return client.auth.signInWithPassword({ email, password });
    },
    async signOut() {
      return client.auth.signOut();
    },
    async loadProgress(userId) {
      return client.from('lesson_progress').select('*').eq('user_id', userId);
    },
    async saveProgress(userId, progress) {
      return client.from('lesson_progress').upsert(progress.map((entry) => ({ ...entry, user_id: userId })), { onConflict: 'user_id,lesson_id' });
    },
  };
}
