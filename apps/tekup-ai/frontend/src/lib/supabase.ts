import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

interface EnvConfig {
  process?: {
    env?: Record<string, string | undefined>;
  };
}

const env = (globalThis as unknown as EnvConfig).process?.env;
const SUPABASE_URL = env?.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  if (typeof window === 'undefined') {
    throw new Error('Supabase client is only available in the browser runtime');
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured');
  }

  browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}
