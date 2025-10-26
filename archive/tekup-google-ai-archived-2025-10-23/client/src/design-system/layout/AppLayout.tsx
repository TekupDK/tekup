/**
 * RenOS Design System - AppLayout Component
 * 
 * Main application layout with sidebar and header
 */

import * as React from 'react';
import { cn } from '../utils';
import { Sidebar, type NavItem } from './Sidebar';
import { Header, type HeaderProps } from './Header';

export interface AppLayoutProps {
  /**
   * Page content
   */
  children: React.ReactNode;
  
  /**
   * Navigation items for sidebar
   */
  navItems: NavItem[];
  
  /**
   * Header props
   */
  headerProps?: Omit<HeaderProps, 'sidebarCollapsed'>;
  
  /**
   * Custom logo for sidebar
   */
  logo?: React.ReactNode;
  
  /**
   * Initial collapsed state
   */
  defaultCollapsed?: boolean;
  
  /**
   * Show sidebar footer
   */
  showSidebarFooter?: boolean;
  
  /**
   * Custom className for content area
   */
  contentClassName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  navItems,
  headerProps,
  logo,
  defaultCollapsed = false,
  showSidebarFooter = true,
  contentClassName,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Persist collapsed state to localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        items={navItems}
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        logo={logo}
        showFooter={showSidebarFooter}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header */}
        <Header {...headerProps} sidebarCollapsed={isCollapsed} />

        {/* Content */}
        <main
          className={cn(
            'pt-16', // Header height offset
            'min-h-screen',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
