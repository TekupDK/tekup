import { useState, useEffect } from 'react';

export interface ClaudeAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  userId: string;
  subscriptionType: string;
  account: {
    email_address: string;
    uuid: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  session: ClaudeAuthSession | null;
  isLoading: boolean;
  error: string | null;
  hasPendingAuth: boolean;
}

export function useClaudeAuth() {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-frontend-src-h');

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    session: null,
    isLoading: true,
    error: null,
    hasPendingAuth: false
  });

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // For web, we'll simulate an authenticated state.
      // The backend will use the API key.
      if (typeof window !== 'undefined' && !window.electronAPI?.auth) {
        logger.info("[DEBUG AUTH] Web mode detected. Simulating authenticated state.");
        const demoSession: ClaudeAuthSession = {
          accessToken: 'web-session-token',
          refreshToken: 'web-refresh-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
          scopes: ['claude:read', 'claude:write'],
          userId: 'web-user',
          subscriptionType: 'api',
          account: {
            email_address: 'user@web.com',
            uuid: 'web-user-uuid'
          }
        };
        setAuthState({
          isAuthenticated: true,
          session: demoSession,
          isLoading: false,
          error: null,
          hasPendingAuth: false
        });
        return;
      }
      
      logger.info("[DEBUG AUTH] Checking authentication status...");
      logger.info("[DEBUG AUTH] Window available:", typeof window !== 'undefined');
      logger.info("[DEBUG AUTH] ElectronAPI available:", !!window?.electronAPI);
      logger.info("[DEBUG AUTH] Auth API available:", !!window?.electronAPI?.auth);
      
      // Check if we have access to electronAPI (only available in Electron context)
      if (typeof window !== 'undefined' && window.electronAPI?.auth) {
        logger.info("[DEBUG AUTH] Calling electronAPI.auth.checkStatus()...");
        const result = await window.electronAPI.auth.checkStatus();
        logger.info("[DEBUG AUTH] Auth status result:", result);
        
        if (result.success) {
          setAuthState({
            isAuthenticated: result.isAuthenticated,
            session: result.session || null,
            isLoading: false,
            error: null,
            hasPendingAuth: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            session: null,
            isLoading: false,
            error: result.error || 'Authentication check failed',
            hasPendingAuth: false
          });
        }
      } else {
        // No Electron API available (probably running in browser)
        logger.info("[DEBUG AUTH] No Electron API available, setting unauthenticated state");
        setAuthState({
          isAuthenticated: false,
          session: null,
          isLoading: false,
          error: null,
          hasPendingAuth: false
        });
      }
    } catch (error) {
      logger.error('Failed to check auth status:', error);
      setAuthState({
        isAuthenticated: false,
        session: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        hasPendingAuth: false
      });
    }
  };

  const signIn = async () => {
    // In web mode, simulate authentication and set demo session
    if (typeof window !== 'undefined' && !window.electronAPI?.auth) {
        logger.info("[DEBUG AUTH] signIn called in web mode. Simulating authentication.");
        const demoSession = {
          userId: 'web-user',
          subscriptionType: 'api',
          account: {
            email_address: 'user@web.com',
            uuid: 'web-user-uuid'
          }
        };
        setAuthState({
          isAuthenticated: true,
          session: demoSession,
          isLoading: false,
          error: null,
          hasPendingAuth: false
        });
        return;
    }

    // Electron mode - handle OAuth flow
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await window.electronAPI.auth.startOAuth();
      
      if (result.success) {
        // OAuth flow started successfully, update state to show pending
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          hasPendingAuth: result.pendingAuth || false,
          error: null
        }));
      } else {
        throw new Error(result.error || 'OAuth flow failed to start');
      }
    } catch (error) {
      logger.error('Sign in failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
        hasPendingAuth: false
      }));
    }
  };

  const completeAuth = async (authCode: string) => {
    // In web mode, simulate authentication completion
    if (typeof window !== 'undefined' && !window.electronAPI?.auth) {
        logger.info("[DEBUG AUTH] completeAuth called in web mode. Simulating authentication completion.");
        const demoSession = {
          userId: 'web-user',
          subscriptionType: 'api',
          account: {
            email_address: 'user@web.com',
            uuid: 'web-user-uuid'
          }
        };
        setAuthState({
          isAuthenticated: true,
          session: demoSession,
          isLoading: false,
          error: null,
          hasPendingAuth: false
        });
        return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!window.electronAPI?.auth) {
        throw new Error('Authentication is only available in the Electron app');
      }

      const result = await window.electronAPI.auth.completeOAuth(authCode);
      
      if (result.success && result.session) {
        setAuthState({
          isAuthenticated: true,
          session: result.session,
          isLoading: false,
          error: null,
          hasPendingAuth: false
        });
      } else {
        throw new Error(result.error || 'Authentication completion failed');
      }
    } catch (error) {
      logger.error('Auth completion failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication completion failed',
        hasPendingAuth: true // Keep pending state so user can try again
      }));
    }
  };

  const signOut = async () => {
    // In web mode, this is a no-op
    if (typeof window !== 'undefined' && !window.electronAPI?.auth) {
        logger.info("[DEBUG AUTH] signOut called in web mode. No action taken.");
        // We can clear the simulated session if we want
        setAuthState({
            isAuthenticated: false,
            session: null,
            isLoading: false,
            error: null,
            hasPendingAuth: false
          });
        return;
    }
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (window.electronAPI?.auth) {
        const result = await window.electronAPI.auth.signOut();
        
        if (!result.success) {
          throw new Error(result.error || 'Sign out failed');
        }
      }
      
      setAuthState({
        isAuthenticated: false,
        session: null,
        isLoading: false,
        error: null,
        hasPendingAuth: false
      });
    } catch (error) {
      logger.error('Sign out failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
        hasPendingAuth: false
      }));
    }
  };

  const refreshToken = async () => {
    // This would implement token refresh logic
    await checkAuthStatus();
  };

  return {
    ...authState,
    signIn,
    completeAuth,
    signOut,
    refreshToken,
    checkAuthStatus
  };
}