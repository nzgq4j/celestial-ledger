/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly NEXT_PUBLIC_CELESTIAL_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_CELESTIAL_SUPABASE_KEY?: string;
  readonly NEXT_PUBLIC_STORAGE_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}
