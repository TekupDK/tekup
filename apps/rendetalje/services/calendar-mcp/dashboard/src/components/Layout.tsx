import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Kalender', href: '/calendar', icon: Calendar },
    { name: 'Bookinger', href: '/bookings', icon: BookOpen },
    { name: 'Kunder', href: '/customers', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Indstillinger', href: '/settings', icon: Settings },
    { name: 'Admin', href: '/admin', icon: Shield },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 bg-opacity-75" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg lg:static lg:inset-0 lg:translate-x-0 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`flex h-16 items-center justify-between px-6 border-b transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  RenOS
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Calendar MCP
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-2 transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className={`border-t p-4 transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Admin User
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Online
                </p>
              </div>
              <button className={`p-1 transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={`shadow-sm border-b transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Søg..."
                  className={`pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/30'
                    : 'text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
                aria-label={isDarkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <button className={`relative p-2 transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  MCP Connected
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
