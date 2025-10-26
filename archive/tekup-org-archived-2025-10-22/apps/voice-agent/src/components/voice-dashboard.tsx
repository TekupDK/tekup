'use client';

import React, { useState } from 'react';
import { VoiceControlPanel } from './voice-control-panel';
import { ConversationView } from './conversation-view';
import { QuickActionsGrid } from './quick-actions-grid';
import { TenantContextBanner } from './tenant-context-banner';
import { TenantSwitcher } from './tenant-switcher';
import { VoiceCommandExecutor } from './voice-command-executor';
import { useVoiceTenant } from '@/contexts/voice-tenant-context';
import { VoiceResponse, createLogger } from '@tekup/shared';

export const VoiceDashboard: React.FC = () => {
  const logger = createLogger('apps-voice-agent-src-component');

  const { currentTenant, tenantSettings, isTenantActive } = useVoiceTenant();
  const [commandResponses, setCommandResponses] = useState<VoiceResponse[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleCommandExecuted = (response: VoiceResponse) => {
    setCommandResponses(prev => [...prev, response]);
    setLastError(null);

    // Add to conversation if it's a successful command
    if (response.success && response.data?.message) {
      // TODO: Add to voice store conversation
      logger.info('Command response:', response.data.message);
    }
  };

  const handleError = (error: string) => {
    setLastError(error);
    logger.error('Voice command error:', error);
  };

  const clearResponses = () => {
    setCommandResponses([]);
    setLastError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header med Tenant Info */}
      <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between bg-neutral-900">
        <div className="flex items-center space-x-4">
          <div className="font-semibold text-neutral-200">
            <span className="text-brand font-bold">TekUp Voice Agent</span>
            <span className="text-neutral-400 mx-2">/</span>
            <span className="text-neutral-300 capitalize">{currentTenant}</span>
          </div>

          {/* Tenant Branding */}
          {tenantSettings?.brand_display_name && (
            <div className="text-sm text-neutral-400">
              for {tenantSettings.brand_display_name}
            </div>
          )}
        </div>

        {/* Tenant Switcher */}
        <div className="flex items-center space-x-4">
          <TenantSwitcher />

          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTenantActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-neutral-400">
              {isTenantActive ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Tenant Context Banner */}
          <TenantContextBanner
            tenant={currentTenant}
            settings={tenantSettings}
          />

          {/* Voice Controls */}
          <VoiceControlPanel />

          {/* Voice Command Executor */}
          <VoiceCommandExecutor
            onCommandExecuted={handleCommandExecuted}
            onError={handleError}
          />

          {/* Error Display */}
          {lastError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-200 font-medium">Fejl:</span>
                  <span className="text-red-100">{lastError}</span>
                </div>
                <button
                  onClick={() => setLastError(null)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Command Responses */}
          {commandResponses.length > 0 && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-200">
                  Kommando Svar
                </h3>
                <button
                  onClick={clearResponses}
                  className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-sm text-neutral-300 transition-colors"
                >
                  Ryd Svar
                </button>
              </div>

              <div className="space-y-3">
                {commandResponses.map((response, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded ${
                      response.success
                        ? 'bg-green-900/20 border border-green-700/50'
                        : 'bg-red-900/20 border border-red-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        response.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        response.success ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {response.success ? 'Succes' : 'Fejl'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {response.success && response.data?.message && (
                      <p className="text-neutral-200">{response.data.message}</p>
                    )}

                    {!response.success && response.error && (
                      <p className="text-red-200">{response.error}</p>
                    )}

                    {response.data && Object.keys(response.data).length > 1 && (
                      <details className="mt-2">
                        <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-300">
                          Vis detaljer
                        </summary>
                        <pre className="mt-2 text-xs text-neutral-300 bg-neutral-900 p-2 rounded overflow-x-auto">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation View */}
          <ConversationView />

          {/* Quick Actions Grid */}
          <QuickActionsGrid
            tenant={currentTenant}
            settings={tenantSettings}
          />
        </div>
      </div>
    </div>
  );
};
