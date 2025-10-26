import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

// ============================================================================
// Supabase Authentication Middleware
// Replaces the Clerk authentication middleware
// ============================================================================

// Initialize Supabase client for Express middleware
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

// Express middleware for authentication
// Express middleware for authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to request
    req.userId = user.id;
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
};

// Optional: Check specific permissions based on user metadata
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;
    if (userRole !== role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email?: string
    user_metadata?: any
    app_metadata?: any
  }
}

export const requireAuthNext = async (
  req: NextRequest,
  res: NextResponse,
  next: () => void
) => {
  try {
    // Create Supabase client for server-side authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get the current user from the session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Attach user to request object
    ;(req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }

    // Continue to the next middleware/handler
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Express.js style middleware wrapper for API routes
// ============================================================================

export const withAuth = (handler: (req: AuthenticatedRequest, res: NextResponse) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    try {
      // Create Supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              // Note: Setting cookies in middleware has limitations
              // Consider using the response object in the handler instead
            },
            remove(name: string, options: CookieOptions) {
              // Note: Removing cookies in middleware has limitations
            },
          },
        }
      )

      // Verify authentication
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        )
      }

      // Attach user to request
      ;(req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      }

      // Call the actual handler
      const response = NextResponse.next()
      return await handler(req as AuthenticatedRequest, response)

    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

// ============================================================================
// Optional: Admin role check
// ============================================================================

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: NextResponse,
  next: () => void
) => {
  if (!req.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  // Check if user has admin role in app_metadata
  const isAdmin = req.user.app_metadata?.role === 'admin' || 
                  req.user.app_metadata?.roles?.includes('admin')

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  next()
}

// ============================================================================
// Utility functions for checking authentication in components
// ============================================================================

export const getServerUser = async (req: NextRequest) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {
          // No-op for read-only operations
        },
        remove() {
          // No-op for read-only operations
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ============================================================================
// Migration helpers - for gradual transition from Clerk
// ============================================================================

// Helper to check if we're still using Clerk or have migrated to Supabase
export const isUsingSupabase = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Fallback authentication check (supports both Clerk and Supabase during migration)
export const requireAuthFallback = async (req: NextRequest) => {
  if (isUsingSupabase()) {
    // Use Supabase authentication
    const user = await getServerUser(req)
    return user
  } else {
    // Fallback to Clerk (if still configured)
    // This allows for gradual migration
    console.warn('Supabase not configured, falling back to existing auth system')
    return null
  }
}