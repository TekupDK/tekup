'use client';

import { Fragment } from 'react';
import { useAuth } from '@tekup/sso';
import {
  CashIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserIcon,
  LogoutIcon,
} from '@heroicons/react/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { name: 'POS Kasse', id: 'pos', icon: CashIcon },
  { name: 'Menu Styring', id: 'menu', icon: DocumentTextIcon },
  { name: 'Compliance', id: 'compliance', icon: ShieldCheckIcon },
  { name: 'Analyser', id: 'analytics', icon: ChartBarIcon },
];

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">FoodTruck OS</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        activeTab === item.id
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogoutIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
