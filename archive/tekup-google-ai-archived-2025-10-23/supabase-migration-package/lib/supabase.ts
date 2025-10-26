import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================================================
// Supabase Client Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// ============================================================================
// Client-side Supabase client (for use in components)
// ============================================================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// ============================================================================
// Server-side Supabase client (for use in API routes and server components)
// ============================================================================
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// ============================================================================
// Service role client (for admin operations)
// ============================================================================
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ============================================================================
// Database Types (Auto-generated from Supabase)
// ============================================================================
export type Database = {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string
          user_id: string | null
          channel: string | null
          locale: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          channel?: string | null
          locale?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          channel?: string | null
          locale?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string | null
          role: string
          content: string
          timestamp: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          role: string
          content: string
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          role?: string
          content?: string
          timestamp?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          company_name: string | null
          notes: string | null
          status: string | null
          tags: string[] | null
          total_leads: number | null
          total_bookings: number | null
          total_revenue: number | null
          last_contact_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          total_leads?: number | null
          total_bookings?: number | null
          total_revenue?: number | null
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          notes?: string | null
          status?: string | null
          tags?: string[] | null
          total_leads?: number | null
          total_bookings?: number | null
          total_revenue?: number | null
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          session_id: string | null
          customer_id: string | null
          source: string | null
          name: string | null
          email: string | null
          phone: string | null
          address: string | null
          square_meters: number | null
          rooms: number | null
          task_type: string | null
          preferred_dates: string[] | null
          status: string | null
          email_thread_id: string | null
          follow_up_attempts: number | null
          last_follow_up_date: string | null
          idempotency_key: string | null
          company_name: string | null
          industry: string | null
          estimated_size: string | null
          estimated_value: number | null
          enrichment_data: any | null
          last_enriched: string | null
          score: number | null
          priority: string | null
          last_scored: string | null
          score_metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          source?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          square_meters?: number | null
          rooms?: number | null
          task_type?: string | null
          preferred_dates?: string[] | null
          status?: string | null
          email_thread_id?: string | null
          follow_up_attempts?: number | null
          last_follow_up_date?: string | null
          idempotency_key?: string | null
          company_name?: string | null
          industry?: string | null
          estimated_size?: string | null
          estimated_value?: number | null
          enrichment_data?: any | null
          last_enriched?: string | null
          score?: number | null
          priority?: string | null
          last_scored?: string | null
          score_metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          source?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          square_meters?: number | null
          rooms?: number | null
          task_type?: string | null
          preferred_dates?: string[] | null
          status?: string | null
          email_thread_id?: string | null
          follow_up_attempts?: number | null
          last_follow_up_date?: string | null
          idempotency_key?: string | null
          company_name?: string | null
          industry?: string | null
          estimated_size?: string | null
          estimated_value?: number | null
          enrichment_data?: any | null
          last_enriched?: string | null
          score?: number | null
          priority?: string | null
          last_scored?: string | null
          score_metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string | null
          lead_id: string | null
          quote_id: string | null
          service_type: string | null
          address: string | null
          scheduled_at: string | null
          estimated_duration: number | null
          start_time: string | null
          end_time: string | null
          status: string | null
          calendar_event_id: string | null
          calendar_link: string | null
          notes: string | null
          actual_start_time: string | null
          actual_end_time: string | null
          actual_duration: number | null
          time_variance: number | null
          efficiency_score: number | null
          time_notes: string | null
          timer_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          quote_id?: string | null
          service_type?: string | null
          address?: string | null
          scheduled_at?: string | null
          estimated_duration?: number | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          calendar_event_id?: string | null
          calendar_link?: string | null
          notes?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          actual_duration?: number | null
          time_variance?: number | null
          efficiency_score?: number | null
          time_notes?: string | null
          timer_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          quote_id?: string | null
          service_type?: string | null
          address?: string | null
          scheduled_at?: string | null
          estimated_duration?: number | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          calendar_event_id?: string | null
          calendar_link?: string | null
          notes?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          actual_duration?: number | null
          time_variance?: number | null
          efficiency_score?: number | null
          time_notes?: string | null
          timer_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Utility functions
// ============================================================================

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign in with email/password
export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

// Sign up with email/password
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password })
}

// Sign in with Google
export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Sign out
export const signOut = async () => {
  return await supabase.auth.signOut()
}

// ============================================================================
// Real-time subscriptions helpers
// ============================================================================

// Subscribe to chat messages for a session
export const subscribeToChatMessages = (sessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`chat_messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to leads updates
export const subscribeToLeads = (callback: (payload: any) => void) => {
  return supabase
    .channel('leads')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads'
      },
      callback
    )
    .subscribe()
}

// Subscribe to bookings updates
export const subscribeToBookings = (callback: (payload: any) => void) => {
  return supabase
    .channel('bookings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings'
      },
      callback
    )
    .subscribe()
}