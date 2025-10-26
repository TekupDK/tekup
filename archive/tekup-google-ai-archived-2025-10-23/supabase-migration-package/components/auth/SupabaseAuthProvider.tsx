'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ============================================================================
// Supabase Auth Context
// Replaces Clerk's authentication context
// ============================================================================

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Auth Provider Component
// ============================================================================

interface SupabaseAuthProviderProps {
  children: React.ReactNode
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in:', session?.user?.email)
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed for user:', session?.user?.email)
            break
          case 'USER_UPDATED':
            console.log('User updated:', session?.user?.email)
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return { error }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Custom Hook for using Auth Context
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// ============================================================================
// Higher-Order Component for protecting routes
// ============================================================================

interface WithAuthProps {
  fallback?: React.ReactNode
  redirectTo?: string
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) => {
  const AuthenticatedComponent = (props: P) => {
    const { user, loading } = useAuth()
    const { fallback, redirectTo = '/auth/signin' } = options

    useEffect(() => {
      if (!loading && !user && redirectTo) {
        window.location.href = redirectTo
      }
    }, [user, loading])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
            <a 
              href={redirectTo} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  return AuthenticatedComponent
}

// ============================================================================
// Utility Hooks
// ============================================================================

// Hook to check if user is authenticated
export const useIsAuthenticated = () => {
  const { user, loading } = useAuth()
  return { isAuthenticated: !!user, loading }
}

// Hook to get user profile
export const useUserProfile = () => {
  const { user } = useAuth()
  return {
    id: user?.id,
    email: user?.email,
    name: user?.user_metadata?.full_name || user?.user_metadata?.name,
    avatar: user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
    metadata: user?.user_metadata,
    appMetadata: user?.app_metadata
  }
}

// Hook for admin check
export const useIsAdmin = () => {
  const { user } = useAuth()
  const isAdmin = user?.app_metadata?.role === 'admin' || 
                  user?.app_metadata?.roles?.includes('admin')
  return isAdmin
}