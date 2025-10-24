/**
 * 🔐 useAuth Hook
 *
 * Authentication hook with biometric support
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'manager' | 'admin';
  avatar?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  checkBiometricSupport: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  biometricEnabled: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { user, token } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithBiometric: async () => {
    const { biometricEnabled } = get();

    if (!biometricEnabled) {
      throw new Error('Biometric authentication not enabled');
    }

    set({ isLoading: true });

    try {
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log ind med biometrics',
        fallbackLabel: 'Brug adgangskode',
        cancelLabel: 'Annuller',
      });

      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Retrieve stored token
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');

      if (!token || !userData) {
        throw new Error('No stored credentials');
      }

      const user = JSON.parse(userData);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateUser: (userData: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...userData };
      set({ user: updatedUser });
      SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
    }
  },

  enableBiometric: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      throw new Error('Device does not support biometric authentication');
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      throw new Error('No biometric records found');
    }

    await SecureStore.setItemAsync('biometric_enabled', 'true');
    set({ biometricEnabled: true });
  },

  disableBiometric: async () => {
    await SecureStore.deleteItemAsync('biometric_enabled');
    set({ biometricEnabled: false });
  },

  checkBiometricSupport: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    const enabled = await SecureStore.getItemAsync('biometric_enabled');
    if (enabled === 'true') {
      set({ biometricEnabled: true });
    }

    return compatible && enrolled;
  },

  refreshToken: async () => {
    const { token } = get();

    if (!token) {
      throw new Error('No token to refresh');
    }

    try {
      const response = await apiClient.post('/auth/refresh', { token });
      const { token: newToken } = response.data;

      await SecureStore.setItemAsync('auth_token', newToken);
      set({ token: newToken });
    } catch (error) {
      // Token refresh failed, logout user
      get().logout();
      throw error;
    }
  },
}));

// Hook export
export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    biometricEnabled: store.biometricEnabled,
    login: store.login,
    loginWithBiometric: store.loginWithBiometric,
    logout: store.logout,
    updateUser: store.updateUser,
    enableBiometric: store.enableBiometric,
    disableBiometric: store.disableBiometric,
    checkBiometricSupport: store.checkBiometricSupport,
    refreshToken: store.refreshToken,
  };
};
