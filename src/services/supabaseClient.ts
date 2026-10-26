import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables
// Supports both Vite client variables (VITE_SUPABASE_*) and standard variables
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const supabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  procEnv?.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== '' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseUrl.includes('your-project.supabase.co')
);

// Lazy singleton initialization to avoid crashing if env vars are missing
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export { supabaseUrl };
