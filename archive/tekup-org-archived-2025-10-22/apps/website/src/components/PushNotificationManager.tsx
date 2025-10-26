import React, { useState, useEffect } from 'react';
import { Bell, BellOff, TestTube, Zap, AlertCircle, CheckCircle } from 'lucide-react';

import { pushNotificationService, NotificationTemplates } from '../utils/pushNotifications';

export const PushNotificationManager: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  useEffect(() => {
    const checkSupport = () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(pushNotificationService.getPermissionStatus());
        checkSubscriptionStatus();
      }
    };

    const checkSubscriptionStatus = async () => {
      try {
        const subscribed = await pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    checkSupport();

    // Listen for permission changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSupported) {
        setPermission(pushNotificationService.getPermissionStatus());
        checkSubscriptionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSupported]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setLastAction('');
    
    try {
      const subscription = await pushNotificationService.subscribe();
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        setLastAction('✅ Subscribed successfully');
        
        // Show welcome notification
        setTimeout(async () => {
          try {
            await pushNotificationService.showLocalNotification(NotificationTemplates.welcome);
          } catch (error) {
            console.error('Error showing welcome notification:', error);
          }
        }, 1000);
      } else {
        setLastAction('❌ Subscription failed - permission denied');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setLastAction(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setLastAction('');
    
    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        setLastAction('✅ Unsubscribed successfully');
      } else {
        setLastAction('❌ Unsubscribe failed');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setLastAction(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setLastAction('');
    
    try {
      await pushNotificationService.sendTestNotification();
      setLastAction('✅ Test notification sent');
    } catch (error) {
      console.error('Test notification error:', error);
      setLastAction(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomNotification = async (template: keyof typeof NotificationTemplates) => {
    setIsLoading(true);
    setLastAction('');
    
    try {
      await pushNotificationService.showLocalNotification(NotificationTemplates[template]);
      setLastAction(`✅ ${template} notification sent`);
    } catch (error) {
      console.error('Custom notification error:', error);
      setLastAction(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatusColor = () => {
    switch (permission) {
      case 'granted': return 'text-green-400';
      case 'denied': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getPermissionStatusIcon = () => {
    switch (permission) {
      case 'granted': return <CheckCircle className="w-4 h-4" />;
      case 'denied': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BellOff className="w-5 h-5 text-red-400" />
          Push Notifications
        </h3>
        <p className="text-sm text-gray-400">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-cyan-400" />
        Push Notifications
      </h3>
      
      {/* Status */}
      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Permission:</span>
          <span className={`font-mono text-xs flex items-center gap-2 ${getPermissionStatusColor()}`}>
            {getPermissionStatusIcon()}
            {permission}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Subscription:</span>
          <span className="font-mono text-xs">
            {isSubscribed ? '✅ Active' : '❌ Inactive'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Enable Notifications
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleTestNotification}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              Send Test Notification
            </button>
            
            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              Disable Notifications
            </button>
          </div>
        )}
      </div>

      {/* Notification Templates */}
      {isSubscribed && (
        <div className="mt-6 pt-4 border-t border-slate-600/50">
          <h4 className="text-sm font-semibold text-white mb-3">Quick Notifications</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendCustomNotification('aiUpdate')}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-300 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50"
            >
              🧠 AI Update
            </button>
            <button
              onClick={() => sendCustomNotification('quantumReady')}
              disabled={isLoading}
              className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50"
            >
              ⚡ Quantum
            </button>
            <button
              onClick={() => sendCustomNotification('networkAlert')}
              disabled={isLoading}
              className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 text-orange-300 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50"
            >
              📊 Alert
            </button>
            <button
              onClick={() => sendCustomNotification('welcome')}
              disabled={isLoading}
              className="px-3 py-2 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-green-300 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50"
            >
              🚀 Welcome
            </button>
          </div>
        </div>
      )}

      {/* Last Action Status */}
      {lastAction && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-gray-300">{lastAction}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 pt-4 border-t border-slate-600/50">
        <p className="text-xs text-gray-400">
          Notifications work even when the app is closed. Test different types to see how they appear on your device.
        </p>
      </div>
    </div>
  );
};