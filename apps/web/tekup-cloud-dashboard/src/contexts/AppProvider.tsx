import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppContext } from './appContext';
import type { Tenant, User, Notification } from '../types';

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

