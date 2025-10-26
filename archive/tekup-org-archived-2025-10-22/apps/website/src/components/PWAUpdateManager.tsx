import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, X, AlertCircle } from 'lucide-react';

export const PWAUpdateManager: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // A new service worker is controlling the app
        console.log('PWA: New service worker is now controlling the app');
        
        // Reload the page to get the latest version
        window.location.reload();
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed and waiting
              setUpdateAvailable(true);
            }
          });
        });
      });
    }

    // Auto-dismiss after 30 seconds if not interacted with
    const autoDismissTimer = setTimeout(() => {
      if (updateAvailable && !dismissed) {
        setDismissed(true);
      }
    }, 30000);

    return () => clearTimeout(autoDismissTimer);
  }, [updateAvailable, dismissed]);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    setInstalling(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Tell the waiting service worker to become active
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Show installing state for a moment
        setTimeout(() => {
          setInstalling(false);
          setUpdateAvailable(false);
          setDismissed(true);
          
          // The controllerchange event will trigger a reload
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating PWA:', error);
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    
    // Auto-show again after 5 minutes
    setTimeout(() => {
      if (updateAvailable) {
        setDismissed(false);
      }
    }, 5 * 60 * 1000);
  };

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Update Modal */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-xl p-6 max-w-md mx-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <Download className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">App Update Available</h3>
                <p className="text-sm text-gray-400">En ny version er klar til installation</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">Nye funktioner tilgængelige:</p>
                <ul className="text-blue-200 space-y-1 text-xs">
                  <li>• Forbedret performance og stabilitet</li>
                  <li>• Nye AI funktioner og neural networks</li>
                  <li>• Opdaterede sikkerhedsfunktioner</li>
                  <li>• Optimeret offline oplevelse</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={installing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {installing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Installerer...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Opdater Nu
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              disabled={installing}
              className="px-4 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Senere
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Opdateringen tager kun få sekunder og forbedrer din app-oplevelse
            </p>
          </div>
        </div>
      </div>

      {/* Mini notification for subsequent updates */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Update tilgængelig</p>
              <p className="text-xs opacity-90">Klik for at opdatere</p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={installing}
              className="ml-2 p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${installing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook for using update state in other components
export const usePWAUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      });
    }
  }, []);

  const updateApp = async () => {
    if (!('serviceWorker' in navigator)) return false;

    setInstalling(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
    } catch (error) {
      console.error('Error updating PWA:', error);
    } finally {
      setInstalling(false);
    }

    return false;
  };

  return {
    updateAvailable,
    installing,
    updateApp
  };
};