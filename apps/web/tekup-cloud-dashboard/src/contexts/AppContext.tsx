import { createContext, useContext, useState, ReactNode } from 'react';
import { Tenant, User, Notification } from '../types';

interface AppContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <AppContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        currentUser,
        setCurrentUser,
        notifications,
        setNotifications,
        sidebarCollapsed,
        setSidebarCollapsed,
        currentPage,
        setCurrentPage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
