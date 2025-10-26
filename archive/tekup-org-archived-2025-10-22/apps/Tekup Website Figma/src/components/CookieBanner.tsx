'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Cookie, Settings, X, CheckCircle, Shield } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('tekup_cookie_consent');
    if (!cookieConsent) {
      // Delay showing banner to not interfere with page load
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(cookieConsent);
        setPreferences(savedPrefs);
      } catch (e) {
        console.error('Error parsing cookie preferences:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('tekup_cookie_consent', JSON.stringify(allAccepted));
    localStorage.setItem('tekup_cookie_consent_date', new Date().toISOString());
    
    // Initialize analytics and other services
    initializeServices(allAccepted);
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('tekup_cookie_consent', JSON.stringify(preferences));
    localStorage.setItem('tekup_cookie_consent_date', new Date().toISOString());
    
    // Initialize only selected services
    initializeServices(preferences);
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    setPreferences(onlyNecessary);
    localStorage.setItem('tekup_cookie_consent', JSON.stringify(onlyNecessary));
    localStorage.setItem('tekup_cookie_consent_date', new Date().toISOString());
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const initializeServices = (prefs: CookiePreferences) => {
    // Initialize Google Analytics if allowed
    if (prefs.analytics && typeof window !== 'undefined') {
      // Add Google Analytics initialization here
      console.log('Analytics enabled');
    }
    
    // Initialize marketing tools if allowed
    if (prefs.marketing && typeof window !== 'undefined') {
      // Add marketing tools initialization here
      console.log('Marketing cookies enabled');
    }
    
    // Initialize functional cookies if allowed
    if (prefs.functional && typeof window !== 'undefined') {
      // Add functional services initialization here
      console.log('Functional cookies enabled');
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-modal p-4"
      >
        <div className="container-tekup">
          <Card className="border-gray-200 dark:border-gray-700 shadow-2xl">
            <CardContent className="p-6">
              
              {!showSettings ? (
                /* Basic Cookie Banner */
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Vi respekterer dit privatliv
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Vi bruger cookies til at forbedre din oplevelse på vores website, analysere trafik og tilpasse indhold. 
                        Du kan vælge hvilke cookies du accepterer.
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => setShowSettings(true)}
                          className="text-[var(--color-tekup-primary-fallback)] hover:text-[var(--color-tekup-accent-fallback)] text-sm font-medium transition-colors"
                        >
                          Læs mere om vores cookie politik →
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setShowSettings(true)}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Indstillinger
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Afvis alle
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter alle
                    </Button>
                  </div>
                </div>
              ) : (
                /* Detailed Cookie Settings */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Cookie Indstillinger</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <h4 className="font-semibold text-foreground">Nødvendige Cookies</h4>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                            Påkrævet
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Disse cookies er nødvendige for at websitet fungerer korrekt. De kan ikke deaktiveres.
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2">Analytics Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Hjælper os med at forstå hvordan visitorer interagerer med websitet ved at indsamle og rapportere information anonymt.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            preferences.analytics ? 'bg-[var(--color-tekup-primary-fallback)]' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.analytics ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2">Marketing Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Bruges til at vise dig relevante annoncer baseret på dine interesser og browsing adfærd.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            preferences.marketing ? 'bg-[var(--color-tekup-primary-fallback)]' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.marketing ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Functional Cookies */}
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2">Funktionelle Cookies</h4>
                        <p className="text-sm text-muted-foreground">
                          Muliggør forbedrede funktioner og personalisering som videoer og live chat.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handlePreferenceChange('functional', !preferences.functional)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            preferences.functional ? 'bg-[var(--color-tekup-primary-fallback)]' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.functional ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Afvis alle
                    </Button>
                    <Button
                      onClick={handleAcceptSelected}
                      className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white"
                    >
                      Gem præferencer
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white"
                    >
                      Accepter alle
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}