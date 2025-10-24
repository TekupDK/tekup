import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, ApiError } from "@/lib/api-client";
import { toastService } from "@/lib/toast";
import type { User as ApiUser } from "@/lib/api-client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setToken: (token: string) => void;
  setUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, accessToken } = await apiClient.login(email, password);

          set({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organizationId: user.organization_id,
              phone: user.phone,
            },
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toastService.success(`Velkommen tilbage, ${user.name}!`);
        } catch (error) {
          const errorMessage =
            error instanceof ApiError
              ? (error.data as { message?: string })?.message || "Login fejlede"
              : "Login fejlede";

          set({
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(errorMessage);
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // For registration, we need an organizationId - in a real app, this would come from signup flow
          // For now, use a default or require it as parameter
          const { user, accessToken } = await apiClient.register({
            name,
            email,
            password,
            organizationId: "default-org", // TODO: Get from signup flow
            role: "employee",
          });

          set({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organizationId: user.organization_id,
              phone: user.phone,
            },
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toastService.success(`Konto oprettet! Velkommen, ${name}!`);
        } catch (error) {
          const errorMessage =
            error instanceof ApiError
              ? (error.data as { message?: string })?.message ||
                "Registrering fejlede"
              : "Registrering fejlede";

          set({
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(errorMessage);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        toastService.success("Du er nu logget ud");
      },

      clearError: () => {
        set({ error: null });
      },

      setToken: (token: string) => {
        set({ token });
      },

      setUser: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
