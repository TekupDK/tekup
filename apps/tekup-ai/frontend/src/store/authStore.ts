import { api, ApiError } from '@/lib/api';
import { delay, generateId } from '@/lib/utils';
import type { User } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FALLBACK_DELAY = 400;

type StoreSetter<TState> = (
  partial:
    | TState
    | Partial<TState>
    | ((state: TState) => TState | Partial<TState>),
  replace?: boolean
) => void;

type StoreGetter<TState> = () => TState;

const authStoreCreator = (
  set: StoreSetter<AuthState>,
  get: StoreGetter<AuthState>
) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasInitialized: false,
  async initialize() {
    if (get().hasInitialized) {
      set({ isLoading: false });
      return;
    }

    try {
      const profile = await api.auth.me();
      set({ user: profile, isAuthenticated: true });
    } catch (error) {
      console.warn('Auth initialization skipped:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false, hasInitialized: true });
    }
  },
  async login(email: string, password: string) {
    set({ isLoading: true });
    try {
      const profile = await api.auth.login(email, password);
      set({ user: profile, isAuthenticated: true });
    } catch (error) {
      if (error instanceof ApiError) {
        set({ isLoading: false, isAuthenticated: false });
        throw error;
      }

      console.warn('Falling back to mocked login user:', error);
      await delay(FALLBACK_DELAY);
      const fallbackUser: User = {
        id: generateId('user'),
        email,
        name: email.split('@')[0] ?? 'Tekup User',
      };
      set({ user: fallbackUser, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },
  async register(email: string, password: string, name: string) {
    set({ isLoading: true });
    try {
      const profile = await api.auth.register(email, password, name);
      set({ user: profile, isAuthenticated: true });
    } catch (error) {
      if (error instanceof ApiError) {
        set({ isLoading: false, isAuthenticated: false });
        throw error;
      }

      console.warn('Falling back to mocked registration user:', error);
      await delay(FALLBACK_DELAY);
      const fallbackUser: User = {
        id: generateId('user'),
        email,
        name,
      };
      set({ user: fallbackUser, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },
  async logout() {
    set({ isLoading: true });
    try {
      await api.auth.logout();
    } catch (error) {
      console.warn('Logout request failed, clearing local state only:', error);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
});

export const useAuthStore = create<AuthState>()(
  persist(authStoreCreator, {
    name: 'tekup-ai-auth',
    storage: createJSONStorage<AuthState>(() => localStorage),
    partialize: (state: AuthState) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      hasInitialized: state.hasInitialized,
    }),
  })
);
