'use client';

import { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { Router, Route } from './components/Router';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { LiveChatSupport } from './components/LiveChatSupport';
import { AuthProvider } from './hooks/useAuth';
import { RealtimeProvider } from './components/RealtimeProvider';
import { CookieBanner } from './components/CookieBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Set up smooth scrolling for anchor links
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Set up theme detection
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }

    // URL routing setup
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      // Handle URL-based routing with 404 fallback
      if (path === '/about') setCurrentRoute('about');
      else if (path === '/blog') setCurrentRoute('blog');
      else if (path === '/docs') setCurrentRoute('docs');
      else if (path === '/dashboard') setCurrentRoute('dashboard');
      else if (path === '/contact') setCurrentRoute('contact');
      else if (path === '/pricing') setCurrentRoute('pricing');
      else if (path === '/solutions') setCurrentRoute('solutions');
      else if (path === '/admin') setCurrentRoute('admin');
      else if (path === '/tenant-settings') setCurrentRoute('tenant-settings');
      else if (path === '/automation') setCurrentRoute('automation');
      else if (path === '/scheduling') setCurrentRoute('scheduling');
      else if (path === '/') setCurrentRoute('home');
      else {
        // 404 - redirect to home for invalid routes
        window.history.replaceState({}, '', '/');
        setCurrentRoute('home');
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange(); // Check initial route

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigateTo = (route: Route) => {
    setCurrentRoute(route);
    
    // Update URL without page reload
    const path = route === 'home' ? '/' : `/${route}`;
    window.history.pushState({}, '', path);
    
    // Scroll to top for new pages
    if (route !== 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RealtimeProvider>
          <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navigation - Only show on public pages, not on dashboard/portal pages */}
            {!['dashboard', 'admin', 'tenant-settings', 'automation', 'scheduling'].includes(currentRoute) && (
              <Navigation currentRoute={currentRoute} onNavigate={navigateTo} />
            )}
            
            {/* Main Content */}
            <main className="relative">
              <Router currentRoute={currentRoute} />
            </main>
            
            {/* Footer - Only show on main pages, not dashboard or admin pages */}
            {!['dashboard', 'admin', 'tenant-settings', 'automation', 'scheduling'].includes(currentRoute) && <Footer onNavigate={navigateTo} />}
            
            {/* Toast Notifications */}
            <Toaster 
              position="top-right"
              theme="system" 
              richColors 
              closeButton
              toastOptions={{
                className: 'glass border-[var(--color-tekup-glass-border)] z-toast',
                duration: 4000,
              }}
            />

            {/* Live Chat Support - Available on all pages except dashboard and admin pages */}
            {!['dashboard', 'admin', 'tenant-settings', 'automation'].includes(currentRoute) && (
              <div className="fixed bottom-0 right-0 z-chat p-4">
                <LiveChatSupport 
                  isOpen={isChatOpen}
                  onClose={() => setIsChatOpen(false)}
                />
              </div>
            )}

            {/* Chat Trigger Button - Only show when chat is closed and not on admin pages */}
            {!['dashboard', 'admin', 'tenant-settings', 'automation'].includes(currentRoute) && !isChatOpen && (
              <div className="fixed bottom-0 right-0 z-chat-trigger p-4">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group"
                  aria-label="Åbn live chat support"
                >
                  <svg 
                    className="w-6 h-6 text-white transition-transform group-hover:scale-110" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-0 animate-ping" />
                </button>
              </div>
            )}

            {/* Cookie Banner - GDPR Compliance */}
            <CookieBanner />
          </div>
        </RealtimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}