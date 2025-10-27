import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  Building2,
  TestTube2,
} from "lucide-react";
import { useTheme } from "../../contexts/useTheme";
import { useAppStore } from "../../stores";

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { currentTenant, currentUser, notifications } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo mode is active
    const demoMode = localStorage.getItem("tekup-demo-mode") === "true";
    setIsDemoMode(demoMode);
  }, []);

  const toggleDemoMode = () => {
    const newDemoMode = !isDemoMode;
    if (newDemoMode) {
      localStorage.setItem("tekup-demo-mode", "true");
      setIsDemoMode(true);
    } else {
      localStorage.removeItem("tekup-demo-mode");
      setIsDemoMode(false);
      // Redirect to login
      window.location.href = "/";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const mockTenants = [
    {
      id: "1",
      name: "Acme Corporation",
      plan: "enterprise" as const,
      logo: "",
      created_at: "",
      active: true,
    },
    {
      id: "2",
      name: "TechStart Inc",
      plan: "professional" as const,
      logo: "",
      created_at: "",
      active: true,
    },
    {
      id: "3",
      name: "Local Business",
      plan: "starter" as const,
      logo: "",
      created_at: "",
      active: true,
    },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
              <TestTube2 className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                Demo Mode
              </span>
              <button
                onClick={toggleDemoMode}
                className="ml-1 text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 transition-colors"
                title="Exit Demo Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentTenant?.name || "Select Tenant"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showTenantMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                {mockTenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      setShowTenantMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {tenant.name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {tenant.plan}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  <div>
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          !notification.read
                            ? "bg-primary-50 dark:bg-primary-900/20"
                            : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {currentUser?.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Profile
                  </span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Settings
                  </span>
                </button>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-danger-600 dark:text-danger-400">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
