import React, { useState, useEffect } from 'react';

import { showInstallPrompt, canInstall, isInstalled, isIOSDevice, showIOSInstallInstructions } from '../utils/pwa';

interface InstallPWAButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ 
  className = "", 
  children 
}) => {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial state
    setInstallable(canInstall());
    setInstalled(isInstalled());

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setInstallable(true);
      setInstalled(false);
    };

    const handleInstalled = () => {
      setInstallable(false);
      setInstalled(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    setIsLoading(true);
    
    try {
      if (isIOSDevice() && !installed) {
        showIOSInstallInstructions();
      } else if (installable) {
        const result = await showInstallPrompt();
        console.log('Install prompt result:', result);
        
        if (result === 'accepted') {
          setInstalled(true);
          setInstallable(false);
        }
      }
    } catch (error) {
      console.error('Error during install:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if already installed
  if (installed) {
    return null;
  }

  // Show different content for iOS devices
  if (isIOSDevice()) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center px-4 py-2 text-sm font-medium
          text-white bg-gradient-to-r from-cyan-400 to-blue-500 
          hover:from-cyan-500 hover:to-blue-600 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
          disabled:opacity-50 disabled:cursor-not-allowed
          rounded-md transition-all duration-200
          ${className}
        `}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {children || 'Føj til startskærm'}
      </button>
    );
  }

  // Show install button for other browsers if installable
  if (installable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center px-4 py-2 text-sm font-medium
          text-white bg-gradient-to-r from-cyan-400 to-blue-500 
          hover:from-cyan-500 hover:to-blue-600 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
          disabled:opacity-50 disabled:cursor-not-allowed
          rounded-md transition-all duration-200 shadow-lg hover:shadow-xl
          ${className}
        `}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
        {children || 'Installer app'}
      </button>
    );
  }

  // Don't show button if not installable
  return null;
};

// Hook for using PWA install state in other components
export const usePWAInstall = () => {
  const [installable, setInstallable] = useState(canInstall());
  const [installed, setInstalled] = useState(isInstalled());

  useEffect(() => {
    const handleInstallAvailable = () => {
      setInstallable(true);
      setInstalled(false);
    };

    const handleInstalled = () => {
      setInstallable(false);
      setInstalled(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  return {
    installable,
    installed,
    canInstall: installable,
    isInstalled: installed,
    showInstallPrompt: () => showInstallPrompt(),
  };
};