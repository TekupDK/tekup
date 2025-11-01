'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Check if Supabase environment variables are available
const hasSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    // Server-side: check env vars
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  // Client-side: check env vars
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const createClient = () => {
  if (!hasSupabaseConfig()) {
    // Return a mock client during build if env vars are missing
    // This allows the build to complete even without Supabase configured
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
        signOut: async () => ({ error: null }),
      },
    } as any
  }
  return createClientComponentClient()
}

// Lazy-load supabase client to avoid build-time errors
let _supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!_supabaseClient) {
    _supabaseClient = createClient()
  }
  return _supabaseClient
}

// Create supabase instance - will use mock if env vars are missing
// This is safe to call during build as it handles missing env vars gracefully
export const supabase = (() => {
  // Only create if we're in a runtime context (not during static analysis)
  if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return getSupabase()
  }
  // Return mock during build/static analysis
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ data: null, error: null }),
      }),
    }),
  } as any
})()