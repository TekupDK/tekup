'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Menu, X, Zap, Shield, Users, BarChart3, Brain, FileText, BookOpen, PhoneCall, LogOut, Settings, Crown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { DemoBookingModal } from './DemoBookingModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';

import { Route } from './Router';

interface NavigationProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
}

export function Navigation({ currentRoute, onNavigate }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Monitor theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Create observer for class changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleLogin = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      // Use the auth hook logout function
      logout();
      
      // Navigate to home if on protected pages
      if (['dashboard', 'admin', 'tenant-settings'].includes(currentRoute)) {
        onNavigate('home');
      }
      
      toast.success('Du er nu logget ud');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to home
      onNavigate('home');
    }
  };

  const handleQuickTestLogin = () => {
    // Create a proper mock JWT token structure
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    const now = Math.floor(Date.now() / 1000);
    const expiration = now + (365 * 24 * 60 * 60); // 1 year from now
    
    const payload = {
      sub: 'test-user-demo-2024',
      email: 'demo@tekup.dk',
      name: 'Demo Bruger',
      company: 'Tekup Demo Rengøring',
      tenantId: 'tekup-demo-tenant-2024',
      role: 'owner' as const,
      iat: now,
      exp: expiration
    };
    
    const signature = 'mock-signature-for-demo-purposes';
    
    // Create properly formatted JWT token (base64 encoded parts)
    const mockJwtToken = [
      btoa(JSON.stringify(header)),
      btoa(JSON.stringify(payload)),
      btoa(signature)
    ].join('.');

    // Store realistic test data that matches the JWT structure expected by useAuth
    const mockTokenData = {
      accessToken: mockJwtToken,
      refreshToken: 'mock-refresh-token-demo-2024',
      user: {
        id: 'test-user-demo-2024',
        email: 'demo@tekup.dk',
        name: 'Demo Bruger',
        company: 'Tekup Demo Rengøring',
        role: 'owner' as const,
        tenantId: 'tekup-demo-tenant-2024',
        tenantName: 'Tekup Demo Rengøring',
        tenantOwnerId: 'test-user-demo-2024'
      }
    };

    // Store in localStorage the way AuthProvider expects
    localStorage.setItem('tekup_access_token', mockTokenData.accessToken);
    localStorage.setItem('tekup_refresh_token', mockTokenData.refreshToken);
    localStorage.setItem('tekup_user', JSON.stringify({
      id: mockTokenData.user.id,
      email: mockTokenData.user.email,
      name: mockTokenData.user.name,
      company: mockTokenData.user.company,
      role: mockTokenData.user.role,
      tenant: {
        id: mockTokenData.user.tenantId,
        name: mockTokenData.user.tenantName,
        ownerId: mockTokenData.user.tenantOwnerId
      }
    }));

    // Show success message
    toast.success('Demo login gennemført! Du er nu logget ind som demo bruger.');

    // Trigger auth context update (page refresh to simplify)
    window.location.reload();
  };

  const navItems = [
    {
      label: 'Produkt',
      items: [
        { label: 'CRM', action: () => scrollToSection('crm'), icon: Users, description: 'Komplet kundestyring' },
        { label: 'Lead Platform', action: () => scrollToSection('leads'), icon: BarChart3, description: 'AI-drevet lead scoring' },
        { label: 'Jarvis AI', action: () => scrollToSection('ai'), icon: Brain, description: 'Intelligent automatisering' },
      ]
    },
    { label: 'Priser', action: () => handleNavClick('pricing') },
    { label: 'Løsninger', action: () => handleNavClick('solutions') },
    { label: 'Docs', action: () => handleNavClick('docs'), icon: FileText },
    { label: 'Blog', action: () => handleNavClick('blog'), icon: BookOpen },
    { label: 'Om os', action: () => handleNavClick('about') },
    { label: 'Kontakt', action: () => handleNavClick('contact'), icon: PhoneCall },
  ];

  const handleNavClick = (route: Route) => {
    onNavigate(route);
    setIsOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    if (currentRoute !== 'home') {
      // Navigate to home first, then scroll
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  // Dynamic styles based on theme
  const getNavStyle = () => ({
    background: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
  });

  const getDropdownStyle = () => ({
    background: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
  });

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-navigation"
      style={getNavStyle()}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container-tekup">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button 
            className="flex items-center space-x-2 z-50"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleNavClick('home')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] bg-clip-text text-transparent">
              Tekup
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item, index) => (
              <div key={item.label} className="relative group">
                {item.items ? (
                  <div className="relative">
                    <button className="flex items-center space-x-1 px-3 py-2 text-foreground hover:text-[var(--color-tekup-accent-fallback)] transition-colors duration-200">
                      <span>{item.label}</span>
                      <motion.svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: 0 }}
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    
                    {/* Dropdown */}
                    <motion.div 
                      className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                      style={getDropdownStyle()}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-4 space-y-2">
                        {item.items.map((subItem) => (
                          <motion.button
                            key={subItem.label}
                            onClick={subItem.action}
                            className={`flex items-start space-x-3 p-3 rounded-lg transition-colors duration-200 w-full text-left ${
                              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            {subItem.icon && <subItem.icon className="w-5 h-5 text-[var(--color-tekup-accent-fallback)] mt-0.5" />}
                            <div>
                              <div className="font-medium text-foreground">{subItem.label}</div>
                              <div className="text-sm text-muted-foreground">{subItem.description}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <motion.button
                    onClick={item.action}
                    className="flex items-center space-x-1 px-3 py-2 text-foreground hover:text-[var(--color-tekup-accent-fallback)] transition-colors duration-200"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </motion.button>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 text-foreground hover:text-[var(--color-tekup-accent-fallback)] transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name || 'User'}</span>
                  </button>
                  
                  {/* User Dropdown */}
                  <motion.div 
                    className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                    style={getDropdownStyle()}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleNavClick('dashboard')}
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 w-full text-left ${
                          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4 text-[var(--color-tekup-accent-fallback)]" />
                        <span className="text-foreground">Dashboard</span>
                      </button>
                      
                      {user?.tenant?.ownerId === user?.id && (
                        <>
                          <button
                            onClick={() => handleNavClick('tenant-settings')}
                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 w-full text-left ${
                              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                          >
                            <Settings className="w-4 h-4 text-[var(--color-tekup-accent-fallback)]" />
                            <span className="text-foreground">Tenant Settings</span>
                          </button>
                          
                          <button
                            onClick={() => handleNavClick('admin')}
                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 w-full text-left ${
                              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                          >
                            <Crown className="w-4 h-4 text-[var(--color-tekup-accent-fallback)]" />
                            <span className="text-foreground">Admin</span>
                          </button>
                        </>
                      )}
                      
                      <hr className={`my-2 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-500/10 transition-colors duration-200 w-full text-left text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log ud</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-foreground hover:text-[var(--color-tekup-accent-fallback)] px-4 py-2"
                    onClick={() => handleLogin('login')}
                  >
                    Log ind
                  </Button>
                </motion.div>
                
                {/* Quick Test Login Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-cyan-500 hover:text-cyan-400 px-4 py-2 border-cyan-500 hover:border-cyan-400"
                    onClick={handleQuickTestLogin}
                  >
                    Quick Test
                  </Button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white border-0 px-6 py-2 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleLogin('register')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start gratis
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div 
            className="md:hidden mt-2 p-4 rounded-xl"
            style={getDropdownStyle()}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.items ? (
                    <div className="space-y-2">
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div className="pl-4 space-y-2">
                        {item.items.map((subItem) => (
                          <button
                            key={subItem.label}
                            onClick={subItem.action}
                            className="flex items-center space-x-2 text-muted-foreground hover:text-[var(--color-tekup-accent-fallback)] transition-colors w-full text-left"
                          >
                            {subItem.icon && <subItem.icon className="w-4 h-4" />}
                            <span>{subItem.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={item.action}
                      className="block text-foreground hover:text-[var(--color-tekup-accent-fallback)] transition-colors w-full text-left"
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
              
              <div className={`pt-4 border-t space-y-2 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        handleNavClick('dashboard');
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    
                    {user?.tenant?.ownerId === user?.id && (
                      <>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            setIsOpen(false);
                            handleNavClick('admin');
                          }}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-400"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log ud
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogin('login');
                      }}
                    >
                      Log ind
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white border-0"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogin('register');
                      }}
                    >
                      Start gratis
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Demo Booking Modal */}
      <DemoBookingModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </motion.nav>
  );
}