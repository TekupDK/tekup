import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tenant, User, Notification } from "../types";

interface AppState {
  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Layout
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // User & Tenant
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "created_at">
  ) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentPage: "dashboard",
      setCurrentPage: (page: string) => set({ currentPage: page }),

      // Layout
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      // User & Tenant
      currentTenant: null,
      setCurrentTenant: (tenant: Tenant | null) =>
        set({ currentTenant: tenant }),
      currentUser: null,
      setCurrentUser: (user: User | null) => set({ currentUser: user }),

      // Notifications
      notifications: [],
      setNotifications: (notifications: Notification[]) =>
        set({ notifications }),
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },
      markNotificationAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),

      // Loading states
      isLoading: false,
      setLoading: (isLoading: boolean) => set({ isLoading }),

      // Search
      searchQuery: "",
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),

      // Actions
      reset: () =>
        set({
          currentPage: "dashboard",
          sidebarCollapsed: false,
          currentTenant: null,
          currentUser: null,
          notifications: [],
          isLoading: false,
          searchQuery: "",
        }),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        sidebarCollapsed: state.sidebarCollapsed,
        currentPage: state.currentPage,
        currentUser: state.currentUser,
      }),
    }
  )
);
