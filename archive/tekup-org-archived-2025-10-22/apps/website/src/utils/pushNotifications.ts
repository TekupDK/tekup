// Push Notifications service for TekUp PWA
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Will be set when you configure VAPID keys

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return this.subscriptionToObject(existingSubscription);
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
      });

      console.log('Successfully subscribed to push notifications:', subscription);
      
      // Convert subscription to serializable object
      const subscriptionObj = this.subscriptionToObject(subscription);
      
      // Send subscription to your server
      await this.sendSubscriptionToServer(subscriptionObj);
      
      return subscriptionObj;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const successful = await subscription.unsubscribe();
        
        if (successful) {
          console.log('Successfully unsubscribed from push notifications');
          // Notify server about unsubscription
          await this.removeSubscriptionFromServer(this.subscriptionToObject(subscription));
        }
        
        return successful;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Show a local notification (doesn't require server)
   * @param options
   */
  async showLocalNotification(options: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.svg',
      badge: options.badge || '/icons/icon-72x72.svg',
      tag: options.tag || 'tekup-notification',
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false
    });
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'TekUp Test Notification',
      body: 'Din PWA notification system fungerer perfekt! 🚀',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: 'test-notification',
      data: { type: 'test', timestamp: Date.now() },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/icon-96x96.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true
    });
  }

  /**
   * Convert PushSubscription to serializable object
   * @param subscription
   */
  private subscriptionToObject(subscription: globalThis.PushSubscription): PushSubscription {
    const keys = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');
    
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys ? this.arrayBufferToBase64(keys) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : ''
      }
    };
  }

  /**
   * Convert VAPID key to Uint8Array
   * @param base64String
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   * @param buffer
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }

  /**
   * Send subscription to server (implement this based on your backend)
   * @param subscription
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    console.log('Sending subscription to server:', subscription);
    
    // TODO: Implement actual server endpoint
    // Example:
    // const response = await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to save subscription on server');
    // }
  }

  /**
   * Remove subscription from server
   * @param subscription
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    console.log('Removing subscription from server:', subscription);
    
    // TODO: Implement actual server endpoint
    // Example:
    // await fetch('/api/push/unsubscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ endpoint: subscription.endpoint })
    // });
  }

  /**
   * Set VAPID public key (call this when you have generated VAPID keys)
   * @param publicKey
   */
  setVapidPublicKey(publicKey: string): void {
    this.vapidPublicKey = publicKey;
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();

// Predefined notification templates for TekUp
export const NotificationTemplates = {
  welcome: {
    title: 'Velkommen til TekUp! 🚀',
    body: 'Din digitale transformation starter nu. Udforsk AI Indsigt Platform og intelligent dataanalyse.',
    tag: 'welcome',
    requireInteraction: true
  },
  
  aiUpdate: {
    title: 'System Update 🧠',
    body: 'Nye forretningsanalyser er tilgængelige. Opdater dit system for forbedret performance.',
    tag: 'ai-update',
    actions: [
      { action: 'update', title: 'Update Now' },
      { action: 'later', title: 'Remind Later' }
    ]
  },
  
  businessReady: {
    title: 'Business Intelligence Klar ⚡',
    body: 'Dit system har nye analysekapaciteter. Oplev forbedret forretningsindsigt.',
    tag: 'business-ready',
    requireInteraction: true
  },
  
  networkAlert: {
    title: 'System Alert 📊',
    body: 'Unormal aktivitet detecteret i dit system. Tjek dashboard for detaljer.',
    tag: 'network-alert',
    actions: [
      { action: 'view-dashboard', title: 'View Dashboard' },
      { action: 'acknowledge', title: 'Acknowledge' }
    ]
  }
};