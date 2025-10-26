/**
 * RenOS Design System - Sidebar Component
 * 
 * Collapsible navigation sidebar with icons and active states
 */

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

export interface NavItem {
  /**
   * Display name
   */
  label: string;
  
  /**
   * Route path
   */
  href: string;
  
  /**
   * Icon element (React node or SVG)
   */
  icon?: React.ReactNode;
  
  /**
   * Badge count (optional)
   */
  badge?: number;
  
  /**
   * Group heading
   */
  isGroup?: boolean;
  
  /**
   * Child items (for nested navigation)
   */
  children?: NavItem[];
}

export interface SidebarProps {
  /**
   * Navigation items
   */
  items: NavItem[];
  
  /**
   * Collapsed state
   */
  isCollapsed: boolean;
  
  /**
   * Toggle collapsed state
   */
  onToggle: () => void;
  
  /**
   * Custom logo element
   */
  logo?: React.ReactNode;
  
  /**
   * Show footer section
   */
  showFooter?: boolean;
}

const NavItemComponent: React.FC<{
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}> = ({ item, isCollapsed, isActive }) => {
  if (item.isGroup) {
    return (
      <div className="px-3 py-2">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              {item.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200',
        'text-sm font-medium',
        isActive
          ? 'bg-brand-50 text-brand-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        isCollapsed && 'justify-center'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {item.icon && (
        <span className={cn('flex-shrink-0', isActive && 'text-brand-600')}>
          {item.icon}
        </span>
      )}
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      
      {item.badge && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
            isActive
              ? 'bg-brand-600 text-white'
              : 'bg-gray-200 text-gray-700'
          )}
        >
          {item.badge}
        </motion.span>
      )}
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed,
  onToggle,
  logo,
  showFooter = true,
}) => {
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'flex flex-col',
        'bg-white border-r border-gray-200',
        'shadow-sm'
      )}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              {logo || (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">R</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">RenOS</span>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center"
            >
              <span className="text-lg font-bold text-white">R</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {isCollapsed && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-[26px] w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Expand sidebar"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {items.map((item, index) => (
          <NavItemComponent
            key={item.href || index}
            item={item}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.href}
          />
        ))}
      </nav>

      {/* Footer */}
      {showFooter && (
        <div className={cn(
          'border-t border-gray-200 p-4',
          isCollapsed && 'px-2'
        )}>
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-500"
              >
                <div className="mb-2 font-medium text-gray-700">RenOS v1.0.0</div>
                <div>© 2025 Rendetalje.dk</div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-400 text-center"
              >
                v1.0
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );
};
