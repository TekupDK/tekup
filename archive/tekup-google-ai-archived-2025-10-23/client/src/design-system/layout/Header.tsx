/**
 * RenOS Design System - Header Component
 * 
 * Top navigation bar with search, notifications, and user menu
 */

import * as React from 'react';
import { cn } from '../utils';

export interface HeaderProps {
  /**
   * User info for display
   */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  
  /**
   * Show search bar
   */
  showSearch?: boolean;
  
  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;
  
  /**
   * Search handler
   */
  onSearch?: (query: string) => void;
  
  /**
   * Notification count
   */
  notificationCount?: number;
  
  /**
   * Notification click handler
   */
  onNotificationClick?: () => void;
  
  /**
   * User menu items
   */
  userMenuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
  }>;
  
  /**
   * Custom right content
   */
  rightContent?: React.ReactNode;
  
  /**
   * Sidebar collapsed state (for layout adjustment)
   */
  sidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  showSearch = true,
  searchPlaceholder = 'Søg... (Cmd+K)',
  onSearch,
  notificationCount = 0,
  onNotificationClick,
  userMenuItems,
  rightContent,
  sidebarCollapsed = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30',
        'h-16 bg-white border-b border-gray-200',
        'transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Search */}
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full h-10 pl-10 pr-4 rounded-lg',
                  'bg-gray-50 border border-gray-200',
                  'text-sm text-gray-900 placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                  'transition-all duration-200'
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </form>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3 ml-4">
          {rightContent}
          
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-danger-500 rounded-full">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-brand-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {userMenuItems?.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick();
                          setShowUserMenu(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                          item.variant === 'danger'
                            ? 'text-danger-600 hover:bg-danger-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
