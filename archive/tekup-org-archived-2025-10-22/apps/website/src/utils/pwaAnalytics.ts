// PWA Analytics for TekUp - Track installation, usage, and engagement
import { offlineStorage } from './offlineStorage';

export interface PWAEvent {
  id: string;
  type: PWAEventType;
  timestamp: number;
  data?: Record<string, any>;
  userAgent: string;
  url: string;
}

export type PWAEventType = 
  | 'pwa_install_prompt_shown'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'pwa_installed'
  | 'pwa_launched'
  | 'pwa_standalone_mode'
  | 'notification_permission_requested'
  | 'notification_permission_granted'
  | 'notification_sent'
  | 'notification_clicked'
  | 'offline_usage'
  | 'service_worker_updated'
  | 'page_view'
  | 'feature_used'
  | 'error_occurred';

interface PWAMetrics {
  totalInstalls: number;
  totalLaunches: number;
  averageSessionTime: number;
  offlineUsage: number;
  notificationEngagement: number;
  featureUsage: Record<string, number>;
  errors: number;
  lastActive: number;
}

class PWAAnalyticsService {
  private sessionStart: number = Date.now();
  private isStandalone = false;

  constructor() {
    this.isStandalone = this.checkStandaloneMode();
    this.initializeTracking();
  }

  /**
   * Initialize PWA analytics tracking
   */
  private initializeTracking() {
    // Track PWA launch
    if (this.isStandalone) {
      this.trackEvent('pwa_standalone_mode');
    }
    this.trackEvent('pwa_launched');

    // Track page views
    this.trackEvent('page_view', { 
      page: window.location.pathname,
      referrer: document.referrer 
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    // Track visibility changes (app switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sessionStart = Date.now();
      } else {
        this.trackSessionEnd();
      }
    });

    // Track online/offline status
    window.addEventListener('offline', () => {
      this.trackEvent('offline_usage', { 
        startTime: Date.now() 
      });
    });

    window.addEventListener('online', () => {
      this.trackEvent('feature_used', { 
        feature: 'online_restored' 
      });
    });
  }

  /**
   * Track a PWA event
   * @param type
   * @param data
   */
  async trackEvent(type: PWAEventType, data?: Record<string, any>): Promise<void> {
    const event: PWAEvent = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('PWA Analytics:', event);

    try {
      // Store event locally
      await offlineStorage.storeData(
        event.id, 
        'analytics_event', 
        event,
        60 * 24 * 7 // Keep for 7 days
      );

      // Send to server if online (implement based on your backend)
      if (navigator.onLine) {
        await this.sendEventToServer(event);
      }

      // Update local metrics
      await this.updateMetrics(event);
    } catch (error) {
      console.error('Failed to track PWA event:', error);
    }
  }

  /**
   * Track PWA installation events
   */
  async trackInstallPromptShown(): Promise<void> {
    await this.trackEvent('pwa_install_prompt_shown');
  }

  async trackInstallAccepted(): Promise<void> {
    await this.trackEvent('pwa_install_accepted');
  }

  async trackInstallDismissed(): Promise<void> {
    await this.trackEvent('pwa_install_dismissed');
  }

  async trackInstallCompleted(): Promise<void> {
    await this.trackEvent('pwa_installed');
  }

  /**
   * Track notification events
   */
  async trackNotificationPermissionRequested(): Promise<void> {
    await this.trackEvent('notification_permission_requested');
  }

  async trackNotificationPermissionGranted(): Promise<void> {
    await this.trackEvent('notification_permission_granted');
  }

  async trackNotificationSent(notificationType: string): Promise<void> {
    await this.trackEvent('notification_sent', { 
      type: notificationType 
    });
  }

  async trackNotificationClicked(notificationType: string): Promise<void> {
    await this.trackEvent('notification_clicked', { 
      type: notificationType 
    });
  }

  /**
   * Track feature usage
   * @param feature
   * @param details
   */
  async trackFeatureUsed(feature: string, details?: Record<string, any>): Promise<void> {
    await this.trackEvent('feature_used', { 
      feature, 
      ...details 
    });
  }

  /**
   * Track errors
   * @param error
   * @param context
   */
  async trackError(error: Error, context?: string): Promise<void> {
    await this.trackEvent('error_occurred', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href
    });
  }

  /**
   * Track session end
   */
  private async trackSessionEnd(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStart;
    
    if (sessionDuration > 1000) { // Only track sessions longer than 1 second
      await this.trackEvent('pwa_launched', { 
        sessionDuration,
        isStandalone: this.isStandalone
      });
    }
  }

  /**
   * Get PWA metrics
   */
  async getMetrics(): Promise<PWAMetrics> {
    try {
      const metrics = await offlineStorage.getSetting('pwa_metrics');
      return metrics || this.getDefaultMetrics();
    } catch (error) {
      console.error('Failed to get PWA metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get analytics events for a specific time period
   * @param hours
   */
  async getEvents(hours = 24): Promise<PWAEvent[]> {
    try {
      const allEvents = await offlineStorage.getDataByType('analytics_event');
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      
      return allEvents
        .map(item => item.data as PWAEvent)
        .filter(event => event.timestamp >= cutoffTime)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get analytics events:', error);
      return [];
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    todayLaunches: number;
    weeklyLaunches: number;
    averageSessionTime: number;
    topFeatures: { feature: string; count: number }[];
    installationRate: number;
  }> {
    const events = await this.getEvents(24 * 7); // Last 7 days
    
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const todayLaunches = events.filter(e => 
      e.type === 'pwa_launched' && e.timestamp >= todayStart
    ).length;
    
    const weeklyLaunches = events.filter(e => 
      e.type === 'pwa_launched' && e.timestamp >= weekStart
    ).length;
    
    // Calculate average session time
    const sessionEvents = events.filter(e => 
      e.type === 'pwa_launched' && e.data?.sessionDuration
    );
    
    const averageSessionTime = sessionEvents.length > 0
      ? sessionEvents.reduce((sum, e) => sum + (e.data?.sessionDuration || 0), 0) / sessionEvents.length
      : 0;
    
    // Top features
    const featureEvents = events.filter(e => e.type === 'feature_used');
    const featureCounts: Record<string, number> = {};
    
    featureEvents.forEach(e => {
      const feature = e.data?.feature || 'unknown';
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });
    
    const topFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Installation rate (if we have prompt events)
    const promptEvents = events.filter(e => e.type === 'pwa_install_prompt_shown');
    const acceptedEvents = events.filter(e => e.type === 'pwa_install_accepted');
    const installationRate = promptEvents.length > 0 
      ? (acceptedEvents.length / promptEvents.length) * 100 
      : 0;
    
    return {
      todayLaunches,
      weeklyLaunches,
      averageSessionTime,
      topFeatures,
      installationRate
    };
  }

  /**
   * Update metrics based on event
   * @param event
   */
  private async updateMetrics(event: PWAEvent): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      
      switch (event.type) {
        case 'pwa_installed':
          metrics.totalInstalls++;
          break;
        case 'pwa_launched':
          metrics.totalLaunches++;
          if (event.data?.sessionDuration) {
            const currentTotal = metrics.averageSessionTime * (metrics.totalLaunches - 1);
            metrics.averageSessionTime = (currentTotal + event.data.sessionDuration) / metrics.totalLaunches;
          }
          break;
        case 'offline_usage':
          metrics.offlineUsage++;
          break;
        case 'notification_clicked':
          metrics.notificationEngagement++;
          break;
        case 'feature_used':
          const feature = event.data?.feature || 'unknown';
          metrics.featureUsage[feature] = (metrics.featureUsage[feature] || 0) + 1;
          break;
        case 'error_occurred':
          metrics.errors++;
          break;
      }
      
      metrics.lastActive = Date.now();
      
      await offlineStorage.setSetting('pwa_metrics', metrics);
    } catch (error) {
      console.error('Failed to update PWA metrics:', error);
    }
  }

  /**
   * Send event to server (implement based on your backend)
   * @param event
   */
  private async sendEventToServer(event: PWAEvent): Promise<void> {
    try {
      // TODO: Implement based on your backend
      // Example:
      // await fetch('/api/analytics/pwa', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
      
      console.log('Would send to server:', event);
    } catch (error) {
      console.error('Failed to send event to server:', error);
      // Add to sync queue for retry when online
      await offlineStorage.addToSyncQueue('POST', '/api/analytics/pwa', event);
    }
  }

  /**
   * Check if running in standalone mode
   */
  private checkStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): PWAMetrics {
    return {
      totalInstalls: 0,
      totalLaunches: 0,
      averageSessionTime: 0,
      offlineUsage: 0,
      notificationEngagement: 0,
      featureUsage: {},
      errors: 0,
      lastActive: Date.now()
    };
  }

  /**
   * Clear analytics data (for privacy/debugging)
   */
  async clearAnalyticsData(): Promise<void> {
    try {
      // Clear analytics events
      const events = await offlineStorage.getDataByType('analytics_event');
      for (const event of events) {
        await offlineStorage.deleteData(event.id);
      }
      
      // Reset metrics
      await offlineStorage.setSetting('pwa_metrics', this.getDefaultMetrics());
      
      console.log('PWA analytics data cleared');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }
}

// Create singleton instance
export const pwaAnalytics = new PWAAnalyticsService();

// Auto-track errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    pwaAnalytics.trackError(new Error(event.message), 'global_error_handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    pwaAnalytics.trackError(new Error(event.reason), 'unhandled_promise_rejection');
  });
}