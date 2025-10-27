import { createContext } from "react";
import type { Tenant, User, Notification } from "../types";

export interface AppContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

