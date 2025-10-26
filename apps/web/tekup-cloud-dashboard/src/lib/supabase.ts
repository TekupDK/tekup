import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || 'development';
const mockData = import.meta.env.VITE_MOCK_DATA === 'true';

// Mock mode for development without Supabase
if (appEnv === 'development' && (!supabaseUrl || !supabaseAnonKey || mockData)) {
  console.warn('⚠️ Running in mock mode - Supabase not configured');
}

// Create a mock client that won't cause errors
const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock mode - authentication disabled' } }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock mode - authentication disabled' } }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      })
    })
  })
} as any;

export const supabase = (appEnv === 'development' && (!supabaseUrl || !supabaseAnonKey || mockData))
  ? mockSupabase
  : (() => {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
