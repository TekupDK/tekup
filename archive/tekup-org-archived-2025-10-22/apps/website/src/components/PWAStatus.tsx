import React, { useState, useEffect } from 'react';

import { isInstalled, canInstall, isIOSDevice } from '../utils/pwa';

import { InstallPWAButton, usePWAInstall } from './InstallPWAButton';

export const PWAStatus: React.FC = () => {
  const { installable, installed } = usePWAInstall();
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('Checking...');
  const [manifestStatus, setManifestStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerStatus('✅ Active');
      }).catch(() => {
        setServiceWorkerStatus('❌ Failed');
      });
    } else {
      setServiceWorkerStatus('❌ Not supported');
    }

    // Check manifest
    if ('serviceWorker' in navigator) {
      fetch('/manifest.json')
        .then(response => response.ok ? '✅ Available' : '❌ Failed to load')
        .then(setManifestStatus)
        .catch(() => setManifestStatus('❌ Not found'));
    }
  }, []);

  const getInstallStatus = () => {
    if (installed) return '✅ Installed';
    if (installable) return '🟡 Ready to install';
    if (isIOSDevice()) return '📱 iOS - Manual install available';
    return '⏳ Checking eligibility...';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PWA Status
      </h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Service Worker:</span>
          <span className="font-mono text-xs">{serviceWorkerStatus}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Manifest:</span>
          <span className="font-mono text-xs">{manifestStatus}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Install Status:</span>
          <span className="font-mono text-xs">{getInstallStatus()}</span>
        </div>
        
        {isIOSDevice() && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-300 text-xs">
              iOS detected: Use share button → "Add to Home Screen"
            </p>
          </div>
        )}
      </div>
      
      {(installable || isIOSDevice()) && (
        <div className="mt-4 pt-4 border-t border-slate-600/50">
          <InstallPWAButton className="w-full">
            {isIOSDevice() ? 'Get Install Instructions' : 'Install TekUp App'}
          </InstallPWAButton>
        </div>
      )}
      
      {installed && (
        <div className="mt-4 pt-4 border-t border-slate-600/50">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            App is installed! Launch from your home screen or app drawer.
          </div>
        </div>
      )}
    </div>
  );
};