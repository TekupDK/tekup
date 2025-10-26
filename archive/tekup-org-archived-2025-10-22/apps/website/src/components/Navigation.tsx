import { BarChart3, Brain, Home, Menu, Search, Settings, User, Users, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Oversigt', path: '/' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Brain, label: 'Business Intelligence', path: '/ai-models' },
    { icon: Users, label: 'CRM', path: '/crm' },
    { icon: Settings, label: 'Indstillinger', path: '/settings' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TekUp.dk</h1>
              <p className="text-xs text-gray-400">Din AI-partner</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-blue-600/20 border border-blue-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <Search className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-300">Søg...</span>
            </button>

            {/* User Menu */}
            <button className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <User className="w-5 h-5 text-gray-300" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              {isMobileOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-40">
            <nav className="container mx-auto px-4 py-6 space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-blue-600/20 border border-blue-500/50 shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium text-lg">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Search */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-2 px-6 py-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søg..."
                    className="bg-transparent text-white placeholder-gray-400 outline-none flex-1"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;