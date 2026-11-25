// Supabase client for accounts and sync. Only the public URL and publishable
// key are bundled (both are designed to be public); row-level security protects
// every table. Without them the app runs local-only.
import { Preferences } from '@capacitor/preferences';
import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';

// Each key is referenced explicitly so Vite inlines only these values.
const url: string | undefined =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_CELESTIAL_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key: string | undefined =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.NEXT_PUBLIC_CELESTIAL_SUPABASE_KEY ??
  import.meta.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Session storage in Capacitor Preferences (SharedPreferences on Android). */
const storage: SupportedStorage = {
  getItem: async k => (await Preferences.get({ key: k })).value,
  setItem: async (k, v) => { await Preferences.set({ key: k, value: v }); },
  removeItem: async k => { await Preferences.remove({ key: k }); },
};

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, {
      auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  : null;

export const accountsAvailable = (): boolean => supabase !== null;
