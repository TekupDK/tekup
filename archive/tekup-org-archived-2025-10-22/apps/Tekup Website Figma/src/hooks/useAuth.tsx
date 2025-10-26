'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { environment, getApiUrl } from '../utils/environment';

// JWT Token interface
interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  company?: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'user';
  iat: number;
  exp: number;
}

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatar?: string;
  tenant?: {
    id: string;
    name: string;
    ownerId: string;
  };
  role: 'owner' | 'admin' | 'user';
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT Token utilities
const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // Validate token format first
    if (!token || typeof token !== 'string') {
      console.warn('Invalid token: not a string or empty');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT: does not have 3 parts');
      return null;
    }

    // Add padding if needed for base64 decoding
    let payload = parts[1];
    while (payload.length % 4) {
      payload += '=';
    }

    const decoded = atob(payload);
    const parsedPayload = JSON.parse(decoded);
    
    // Validate required fields
    if (!parsedPayload.sub || !parsedPayload.exp) {
      console.warn('Invalid JWT payload: missing required fields');
      return null;
    }

    return parsedPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  return Date.now() >= payload.exp * 1000;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safe localStorage operations with error handling
  const safeGetItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  };

  const safeSetItem = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  };

  const safeRemoveItem = (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  };

  // Get stored tokens - safe for browser environment
  const getStoredToken = (): string | null => {
    return safeGetItem('tekup_access_token');
  };

  const getStoredRefreshToken = (): string | null => {
    return safeGetItem('tekup_refresh_token');
  };

  // Store tokens - safe for browser environment
  const storeTokens = (accessToken: string, refreshToken: string) => {
    safeSetItem('tekup_access_token', accessToken);
    safeSetItem('tekup_refresh_token', refreshToken);
  };

  // Clear tokens - safe for browser environment
  const clearTokens = () => {
    safeRemoveItem('tekup_access_token');
    safeRemoveItem('tekup_refresh_token');
    safeRemoveItem('tekup_user');
  };

  // Get current token (with automatic refresh if needed)
  const getToken = async (): Promise<string | null> => {
    let token = getStoredToken();
    
    if (!token) return null;
    
    if (isTokenExpired(token)) {
      try {
        await refreshToken();
        token = getStoredToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
        return null;
      }
    }
    
    return token;
  };

  // Refresh access token using refresh token
  const refreshToken = async (): Promise<void> => {
    const refreshTokenValue = getStoredRefreshToken();
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const apiUrl = getApiUrl('/api/auth/refresh');
      
      // Check if we're in development mode and the endpoint might not exist
      const isDevelopment = environment.isDevelopment;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshTokenValue,
        }),
      });

      if (!response.ok) {
        clearTokens();
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const { accessToken, refreshToken: newRefreshToken } = await response.json();
      
      if (!accessToken || !newRefreshToken) {
        clearTokens();
        throw new Error('Invalid refresh response: missing tokens');
      }

      storeTokens(accessToken, newRefreshToken);
      
      // Update user from new token
      const payload = decodeJWT(accessToken);
      if (payload) {
        const userData: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          company: payload.company,
          role: payload.role,
          tenant: {
            id: payload.tenantId,
            name: payload.company || 'Default Tenant',
            ownerId: payload.role === 'owner' ? payload.sub : '',
          },
        };
        setUser(userData);
        safeSetItem('tekup_user', JSON.stringify(userData));
      }
    } catch (error) {
      // Handle network errors, invalid responses, etc.
      clearTokens();
      
      // In development mode, provide more helpful error messages
      if (environment.isDevelopment) {
        console.warn('🔧 Auth Development Mode: Token refresh failed. This is expected if backend auth is not set up.');
        console.warn('💡 For production use, implement the /api/auth/refresh endpoint.');
      } else {
        console.error('Token refresh error:', error);
      }
      
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
      }

      const { 
        accessToken, 
        refreshToken: newRefreshToken, 
        user: userData 
      } = await response.json();

      // Store tokens
      storeTokens(accessToken, newRefreshToken);
      
      // Parse user data from JWT or use provided user data
      const payload = decodeJWT(accessToken);
      const user: User = {
        id: userData?.id || payload?.sub || '',
        email: userData?.email || payload?.email || email,
        name: userData?.name || payload?.name || '',
        company: userData?.company || payload?.company,
        avatar: userData?.avatar,
        role: userData?.role || payload?.role || 'user',
        tenant: {
          id: userData?.tenantId || payload?.tenantId || '',
          name: userData?.tenantName || payload?.company || 'Default Tenant',
          ownerId: userData?.tenantOwnerId || (payload?.role === 'owner' ? payload.sub : ''),
        },
      };

      setUser(user);
      safeSetItem('tekup_user', JSON.stringify(user));
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearTokens();
    setUser(null);
  };

  // Check authentication on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getStoredToken();
        const storedUser = safeGetItem('tekup_user');
        
        // If no token or stored user, just finish loading
        if (!token || !storedUser) {
          setIsLoading(false);
          return;
        }

        // Validate stored user data
        let userData;
        try {
          userData = JSON.parse(storedUser);
          if (!userData || !userData.id || !userData.email) {
            console.warn('Invalid stored user data, clearing tokens');
            clearTokens();
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          clearTokens();
          setIsLoading(false);
          return;
        }

        // Validate the token by trying to decode it
        const payload = decodeJWT(token);
        if (!payload) {
          console.warn('Invalid stored token, clearing tokens');
          clearTokens();
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
          // Only try to refresh if we have a refresh token
          const refreshTokenValue = getStoredRefreshToken();
          if (!refreshTokenValue) {
            console.warn('Token expired and no refresh token available');
            clearTokens();
            setIsLoading(false);
            return;
          }

          // In development mode, skip token refresh if it's likely to fail
          if (environment.isDevelopment && !environment.useRealAPI) {
            console.warn('🔧 Development Mode: Skipping token refresh, clearing expired tokens');
            clearTokens();
            setIsLoading(false);
            return;
          }

          try {
            await refreshToken();
          } catch (error) {
            console.error('Initial token refresh failed:', error);
            clearTokens();
            setIsLoading(false);
            return;
          }
        } else {
          // Token is valid, restore user
          setUser(userData);
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure environment is loaded
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    getToken,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route HOC
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}