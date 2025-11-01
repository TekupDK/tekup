import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Check if Supabase environment variables are available
const hasSupabaseConfig = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const createServerClient = () => {
  if (!hasSupabaseConfig()) {
    // Return a mock client during build if env vars are missing
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
    } as any
  }
  return createServerComponentClient({ cookies })
}

