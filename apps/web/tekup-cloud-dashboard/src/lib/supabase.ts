import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || 'development';
const mockData = import.meta.env.VITE_MOCK_DATA === 'true';

// Mock mode for development without Supabase
if (appEnv === 'development' && (!supabaseUrl || !supabaseAnonKey || mockData)) {
  console.warn('⚠️ Running in mock mode - Supabase not configured');
}

// Create a minimal mock client (no 'any' types)
type MockSubscription = { unsubscribe: () => void };
type MockAuth = {
  getSession: () => Promise<{ data: { session: unknown | null }; error: unknown | null }>;
  onAuthStateChange: () => { data: { subscription: MockSubscription } };
  signInWithPassword: () => Promise<{ data: { user: unknown; session: unknown }; error: { message: string } | null }>;
  signUp: () => Promise<{ data: { user: unknown; session: unknown }; error: { message: string } | null }>;
  signOut: () => Promise<{ error: unknown | null }>;
  resetPasswordForEmail: () => Promise<{ data: unknown; error: unknown | null }>;
};

type MockQuery = {
  select: () => {
    eq: () => {
      order: () => {
        limit: () => Promise<{ data: unknown[]; error: unknown | null }>
      }
    }
  };
  insert?: (rows: unknown[]) => {
    select: () => { single: () => Promise<{ data: unknown; error: unknown | null }> };
  };
};

type MockClient = {
  auth: MockAuth;
  from: (_table: string) => MockQuery;
};

const mockSupabase: MockClient = {
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
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
};

export const supabase = (appEnv === 'development' && (!supabaseUrl || !supabaseAnonKey || mockData))
  ? mockSupabase
  : (() => {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
