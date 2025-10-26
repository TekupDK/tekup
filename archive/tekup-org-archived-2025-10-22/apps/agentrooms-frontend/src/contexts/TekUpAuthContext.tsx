import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TekUpUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  tenantId?: string;
  workspaceId: string;
  subscription: {
    plan: string;
    status: 'active' | 'inactive' | 'trial';
    maxUsers: number;
    features: string[];
  };
}

interface AuthContextType {
  user: TekUpUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMitID: () => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const TekUpAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<TekUpUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem('tekup_auth_token');
    if (savedToken) {
      verifyAndSetUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAndSetUser = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setToken(authToken);
        localStorage.setItem('tekup_auth_token', authToken);
      } else {
        localStorage.removeItem('tekup_auth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('tekup_auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const authData = await response.json();
      setUser(authData.user);
      setToken(authData.accessToken);
      localStorage.setItem('tekup_auth_token', authData.accessToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMitID = async () => {
    setIsLoading(true);
    try {
      // Redirect to MitID authentication
      const response = await fetch('/api/auth/mitid/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUri: `${window.location.origin}/auth/mitid/callback`
        }),
      });

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('MitID login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const switchTenant = async (tenantId: string) => {
    if (!token) return;

    try {
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        const newAuthData = await response.json();
        setUser(newAuthData.user);
        setToken(newAuthData.accessToken);
        localStorage.setItem('tekup_auth_token', newAuthData.accessToken);
      }
    } catch (error) {
      console.error('Tenant switch error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tekup_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        loginWithMitID,
        logout,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useTekUpAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useTekUpAuth must be used within a TekUpAuthProvider');
  }
  return context;
};
