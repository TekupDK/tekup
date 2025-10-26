'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyticsEvent {
  event: string;
  page: string;
  data?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private projectId: string = '';
  private publicAnonKey: string = '';
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async initialize() {
    if (this.initialized) return;
    
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      this.projectId = projectId;
      this.publicAnonKey = publicAnonKey;
      this.initialized = true;
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  public async trackEvent(event: string, page: string, data?: Record<string, any>) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.projectId || !this.publicAnonKey) {
      console.warn('Analytics not properly initialized');
      return;
    }

    try {
      const eventData: AnalyticsEvent = {
        event,
        page,
        data: data || {}
      };

      await fetch(`https://${this.projectId}.supabase.co/functions/v1/make-server-68ad12b6/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.publicAnonKey}`,
        },
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  public async trackPageView(page: string, data?: Record<string, any>) {
    await this.trackEvent('page_view', page, data);
  }

  public async trackButtonClick(buttonName: string, page: string, data?: Record<string, any>) {
    await this.trackEvent('button_click', page, { buttonName, ...data });
  }

  public async trackFormSubmit(formName: string, page: string, data?: Record<string, any>) {
    await this.trackEvent('form_submit', page, { formName, ...data });
  }

  public async trackDemo(action: string, page: string, data?: Record<string, any>) {
    await this.trackEvent('demo_interaction', page, { action, ...data });
  }

  public async trackNavigation(from: string, to: string, data?: Record<string, any>) {
    await this.trackEvent('navigation', to, { from, to, ...data });
  }
}

export const analytics = AnalyticsService.getInstance();

interface AnalyticsProviderProps {
  children: React.ReactNode;
  currentPage: string;
}

export function AnalyticsProvider({ children, currentPage }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize analytics
    analytics.initialize();

    // Track page view
    analytics.trackPageView(currentPage);

    // Track time on page
    const startTime = Date.now();
    
    return () => {
      const timeOnPage = Date.now() - startTime;
      analytics.trackEvent('page_exit', currentPage, { 
        timeOnPage: Math.round(timeOnPage / 1000) // in seconds
      });
    };
  }, [currentPage]);

  useEffect(() => {
    // Track scroll depth
    let maxScrollDepth = 0;
    
    const handleScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90].includes(scrollDepth)) {
          analytics.trackEvent('scroll_depth', currentPage, { depth: scrollDepth });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Track final scroll depth
      if (maxScrollDepth > 0) {
        analytics.trackEvent('final_scroll_depth', currentPage, { depth: maxScrollDepth });
      }
    };
  }, [currentPage]);

  return <>{children}</>;
}

// Hook for easy analytics tracking in components
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackButtonClick: analytics.trackButtonClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackDemo: analytics.trackDemo.bind(analytics),
    trackNavigation: analytics.trackNavigation.bind(analytics),
  };
}