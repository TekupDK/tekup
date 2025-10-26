'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  page: (pageName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
  isInitialized: boolean;
  consent: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  updateConsent: (consent: Partial<AnalyticsContextType['consent']>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    hj?: (...args: any[]) => void;
    _hjSettings?: any;
    fbq?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

interface AnalyticsProviderProps {
  children: ReactNode;
  googleAnalyticsId?: string;
  hotjarId?: string;
  facebookPixelId?: string;
  clarityId?: string;
}

export function AnalyticsProvider({ 
  children, 
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID,
  facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
  clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { user, isAuthenticated } = useAuth();
  
  // Get consent from localStorage or default to false (GDPR compliance)
  const [consent, setConsent] = useState(() => {
    if (typeof window === 'undefined') return { analytics: false, marketing: false, functional: true };
    
    const saved = localStorage.getItem('tekup_cookie_consent');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { analytics: false, marketing: false, functional: true };
      }
    }
    return { analytics: false, marketing: false, functional: true };
  });

  // Initialize analytics tools when consent is given
  useEffect(() => {
    if (consent.analytics && !isInitialized) {
      initializeAnalytics();
      setIsInitialized(true);
    }
  }, [consent.analytics, isInitialized]);

  const initializeAnalytics = () => {
    // Google Analytics 4
    if (googleAnalyticsId && consent.analytics) {
      // Load gtag script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(script1);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer!.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', googleAnalyticsId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        // GDPR compliance
        anonymize_ip: true,
        allow_google_signals: consent.marketing,
        allow_ad_personalization_signals: consent.marketing
      });

      console.log('✅ Google Analytics initialized');
    }

    // Hotjar
    if (hotjarId && consent.analytics) {
      (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
        h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments) };
        h._hjSettings = { hjid: hotjarId, hjsv: 6 };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script'); r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
      })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

      console.log('✅ Hotjar initialized');
    }

    // Facebook Pixel
    if (facebookPixelId && consent.marketing) {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return; n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq!('init', facebookPixelId);
      window.fbq!('track', 'PageView');

      console.log('✅ Facebook Pixel initialized');
    }

    // Microsoft Clarity
    if (clarityId && consent.analytics) {
      (function(c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", clarityId);

      console.log('✅ Microsoft Clarity initialized');
    }
  };

  const track = (event: string, properties: Record<string, any> = {}) => {
    if (!consent.analytics) return;

    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        page_title: document.title,
        user_agent: navigator.userAgent,
        language: navigator.language,
        session_id: sessionId
      },
      userId: user?.id,
      sessionId
    };

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event, {
        custom_parameter_1: JSON.stringify(properties),
        user_id: user?.id,
        session_id: sessionId
      });
    }

    // Hotjar
    if (window.hj) {
      window.hj('event', event);
    }

    // Facebook Pixel
    if (window.fbq && consent.marketing) {
      window.fbq('trackCustom', event, properties);
    }

    // Microsoft Clarity
    if (window.clarity) {
      window.clarity('set', event, JSON.stringify(properties));
    }

    // Internal analytics (for our own tracking)
    if (consent.functional) {
      sendInternalEvent(eventData);
    }

    console.log(`📊 Analytics: ${event}`, properties);
  };

  const page = (pageName: string, properties: Record<string, any> = {}) => {
    if (!consent.analytics) return;

    const pageData = {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...properties
    };

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', googleAnalyticsId!, pageData);
    }

    // Hotjar
    if (window.hj) {
      window.hj('stateChange', window.location.pathname);
    }

    // Facebook Pixel
    if (window.fbq && consent.marketing) {
      window.fbq('track', 'PageView');
    }

    track('page_view', pageData);
  };

  const identify = (userId: string, traits: Record<string, any> = {}) => {
    if (!consent.analytics) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', googleAnalyticsId!, {
        user_id: userId,
        custom_map: traits
      });
    }

    // Hotjar
    if (window.hj) {
      window.hj('identify', userId, traits);
    }

    // Facebook Pixel
    if (window.fbq && consent.marketing) {
      window.fbq('init', facebookPixelId!, { uid: userId });
    }

    track('user_identified', { user_id: userId, ...traits });
  };

  const reset = () => {
    // Clear user identification
    track('user_logged_out');
    
    // Reset session
    if (window.gtag) {
      window.gtag('config', googleAnalyticsId!, { user_id: null });
    }
  };

  const updateConsent = (newConsent: Partial<AnalyticsContextType['consent']>) => {
    const updatedConsent = { ...consent, ...newConsent };
    setConsent(updatedConsent);
    
    // Save to localStorage
    localStorage.setItem('tekup_cookie_consent', JSON.stringify(updatedConsent));
    
    // Update Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: updatedConsent.analytics ? 'granted' : 'denied',
        ad_storage: updatedConsent.marketing ? 'granted' : 'denied',
        functionality_storage: updatedConsent.functional ? 'granted' : 'denied',
        personalization_storage: updatedConsent.marketing ? 'granted' : 'denied',
        security_storage: 'granted'
      });
    }

    track('consent_updated', updatedConsent);
  };

  // Send events to our internal analytics system
  const sendInternalEvent = async (eventData: AnalyticsEvent) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tekup_access_token')}`
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      console.error('Internal analytics error:', error);
    }
  };

  // Auto-identify when user logs in
  useEffect(() => {
    if (isAuthenticated && user && consent.analytics) {
      identify(user.id, {
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        tenant_id: user.tenant?.id
      });
    }
  }, [isAuthenticated, user, consent.analytics]);

  // Track page views on route change
  useEffect(() => {
    if (consent.analytics) {
      page(document.title);
    }
  }, [consent.analytics]);

  const value: AnalyticsContextType = {
    track,
    page,
    identify,
    reset,
    isInitialized,
    consent,
    updateConsent
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Predefined tracking events for Tekup
export const trackingEvents = {
  // Authentication
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  
  // Lead Management
  LEAD_CREATED: 'lead_created',
  LEAD_VIEWED: 'lead_viewed',
  LEAD_UPDATED: 'lead_updated',
  LEAD_CONVERTED: 'lead_converted',
  LEAD_SCORED: 'lead_scored',
  
  // CRM Actions
  CONTACT_ADDED: 'contact_added',
  EMAIL_SENT: 'email_sent',
  CALL_LOGGED: 'call_logged',
  MEETING_SCHEDULED: 'meeting_scheduled',
  
  // AI Features
  AI_QUERY: 'ai_query',
  AI_SUGGESTION_ACCEPTED: 'ai_suggestion_accepted',
  AI_SUGGESTION_REJECTED: 'ai_suggestion_rejected',
  
  // Business Events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
  
  // Engagement
  FEATURE_USED: 'feature_used',
  HELP_VIEWED: 'help_viewed',
  SUPPORT_CONTACTED: 'support_contacted',
  DEMO_REQUESTED: 'demo_requested'
} as const;