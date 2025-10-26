import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { TenantContext, AIServiceCategory } from '@tekup/sso'

// Types
interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  avatar?: string
  tenant: {
    id: string
    name: string
    slug: string
  }
  permissions: string[]
  aiServiceAccess: Array<{
    service: AIServiceCategory
    permissions: string[]
    quotaUsed: number
    quotaLimit: number
  }>
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  switchTenant: (tenantId: string) => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAIServiceAccess: (service: AIServiceCategory, permission?: string) => boolean
  getAIServiceQuota: (service: AIServiceCategory) => { used: number; limit: number; percentage: number }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for development
const mockUser: User = {
  id: 'user-123',
  email: 'admin@tekup.dk',
  name: 'TekUp Administrator',
  role: 'SUPER_ADMIN',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  tenant: {
    id: 'tenant-tekup',
    name: 'TekUp',
    slug: 'tekup'
  },
  permissions: [
    'proposal:admin',
    'content:admin', 
    'support:admin',
    'crm:admin',
    'marketing:admin',
    'project:admin',
    'analytics:admin',
    'voice:admin',
    'bi:admin',
    'system:admin'
  ],
  aiServiceAccess: [
    {
      service: AIServiceCategory.PROPOSAL,
      permissions: ['proposal:read', 'proposal:write', 'proposal:admin'],
      quotaUsed: 245,
      quotaLimit: 1000
    },
    {
      service: AIServiceCategory.CONTENT,
      permissions: ['content:read', 'content:write', 'content:publish', 'content:admin'],
      quotaUsed: 156,
      quotaLimit: 800
    },
    {
      service: AIServiceCategory.SUPPORT,
      permissions: ['support:read', 'support:write', 'support:escalate', 'support:admin'],
      quotaUsed: 89,
      quotaLimit: 500
    },
    {
      service: AIServiceCategory.CRM,
      permissions: ['crm:read', 'crm:write', 'crm:delete', 'crm:admin'],
      quotaUsed: 312,
      quotaLimit: 800
    },
    {
      service: AIServiceCategory.MARKETING,
      permissions: ['marketing:read', 'marketing:write', 'marketing:campaign', 'marketing:admin'],
      quotaUsed: 178,
      quotaLimit: 600
    },
    {
      service: AIServiceCategory.PROJECT,
      permissions: ['project:read', 'project:write', 'project:manage', 'project:admin'],
      quotaUsed: 67,
      quotaLimit: 400
    },
    {
      service: AIServiceCategory.ANALYTICS,
      permissions: ['analytics:read', 'analytics:write', 'analytics:admin'],
      quotaUsed: 134,
      quotaLimit: 300
    },
    {
      service: AIServiceCategory.VOICE_AI,
      permissions: ['voice:read', 'voice:write', 'voice:admin'],
      quotaUsed: 45,
      quotaLimit: 200
    },
    {
      service: AIServiceCategory.BUSINESS_INTELLIGENCE,
      permissions: ['bi:read', 'bi:write', 'bi:admin'],
      quotaUsed: 78,
      quotaLimit: 250
    }
  ]
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored auth token
        const token = localStorage.getItem('tekup_auth_token')
        
        if (token) {
          // In development, use mock user
          if (process.env.NODE_ENV === 'development') {
            setUser(mockUser)
          } else {
            // In production, validate token and fetch user
            await validateTokenAndFetchUser(token)
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        localStorage.removeItem('tekup_auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock login for development
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (email === 'admin@tekup.dk' && password === 'admin') {
          setUser(mockUser)
          localStorage.setItem('tekup_auth_token', 'mock-jwt-token-123')
        } else {
          throw new Error('Ugyldige loginoplysninger')
        }
      } else {
        // Real authentication logic
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          throw new Error('Login fejlede')
        }

        const { user: userData, token } = await response.json()
        setUser(userData)
        localStorage.setItem('tekup_auth_token', token)
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tekup_auth_token')
    // Redirect to login will be handled by route protection
  }

  const switchTenant = async (tenantId: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      
      if (process.env.NODE_ENV === 'development') {
        // Mock tenant switch
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const updatedUser = {
          ...user,
          tenant: {
            id: tenantId,
            name: tenantId === 'tenant-tekup' ? 'TekUp' : 'Demo Tenant',
            slug: tenantId === 'tenant-tekup' ? 'tekup' : 'demo'
          }
        }
        
        setUser(updatedUser)
      } else {
        // Real tenant switch logic
        const response = await fetch('/api/auth/switch-tenant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('tekup_auth_token')}`
          },
          body: JSON.stringify({ tenantId }),
        })

        if (!response.ok) {
          throw new Error('Tenant switch failed')
        }

        const { user: updatedUser, token } = await response.json()
        setUser(updatedUser)
        localStorage.setItem('tekup_auth_token', token)
      }
    } catch (error) {
      console.error('Tenant switch failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('tekup_auth_token')
    if (!token) return

    try {
      await validateTokenAndFetchUser(token)
    } catch (error) {
      console.error('User refresh failed:', error)
      logout()
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true
    
    return user.permissions.includes(permission)
  }

  const hasAIServiceAccess = (service: AIServiceCategory, permission?: string): boolean => {
    if (!user) return false
    
    const serviceAccess = user.aiServiceAccess.find(access => access.service === service)
    if (!serviceAccess) return false
    
    if (!permission) return true
    
    return serviceAccess.permissions.includes(permission)
  }

  const getAIServiceQuota = (service: AIServiceCategory) => {
    if (!user) return { used: 0, limit: 0, percentage: 0 }
    
    const serviceAccess = user.aiServiceAccess.find(access => access.service === service)
    if (!serviceAccess) return { used: 0, limit: 0, percentage: 0 }
    
    const percentage = (serviceAccess.quotaUsed / serviceAccess.quotaLimit) * 100
    
    return {
      used: serviceAccess.quotaUsed,
      limit: serviceAccess.quotaLimit,
      percentage: Math.round(percentage)
    }
  }

  const validateTokenAndFetchUser = async (token: string): Promise<void> => {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Token validation failed')
    }

    const userData = await response.json()
    setUser(userData)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    switchTenant,
    refreshUser,
    hasPermission,
    hasAIServiceAccess,
    getAIServiceQuota
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

