'use client';

import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (route: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-8xl md:text-9xl font-bold text-transparent bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] bg-clip-text mb-4">
            404
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-full flex items-center justify-center mb-6">
              <HelpCircle className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Siden blev ikke fundet
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            Vi kunne ikke finde den side du søger. Den kan være flyttet, slettet eller du har indtastet en forkert URL.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button 
            size="lg"
            onClick={() => onNavigate('home')}
            className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white px-8 py-3 font-semibold hover:shadow-lg transition-all duration-300"
          >
            <Home className="w-5 h-5 mr-2" />
            Gå til forsiden
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="border-[var(--color-tekup-primary-fallback)] text-[var(--color-tekup-primary-fallback)] hover:bg-[var(--color-tekup-primary-fallback)] hover:text-white px-8 py-3 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Gå tilbage
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">
            Populære sider
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Produkter', route: 'home', icon: '🚀' },
              { label: 'Priser', route: 'pricing', icon: '💰' },
              { label: 'Om os', route: 'about', icon: '👥' },
              { label: 'Kontakt', route: 'contact', icon: '📞' }
            ].map((link) => (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-[var(--color-tekup-primary-fallback)] transition-colors">
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search Suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Eller prøv at søge efter det du leder efter:
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Søg på Tekup..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-tekup-primary-fallback)] focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Redirect to search or docs
                  onNavigate('docs');
                }
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}