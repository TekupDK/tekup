'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { VoiceIntegrationService } from '@/services/voice-integration.service';
import { RealTimeVoiceService } from '@/services/real-time-voice.service';
import { VoiceCommand, VoiceResponse, createLogger } from '@tekup/shared';
import { useVoiceStore } from '@/store/voice-store';

const logger = createLogger('voice-command-executor');

interface VoiceCommandExecutorProps {
  onCommandExecuted: (response: VoiceResponse) => void;
  onError: (error: string) => void;
}

export const VoiceCommandExecutor: React.FC<VoiceCommandExecutorProps> = ({

  onCommandExecuted,
  onError,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [useRealTime, setUseRealTime] = useState(true);
  const [realTimeStatus, setRealTimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const { tenantContext } = useVoiceStore();

  // Initialize services
  const [voiceIntegrationService, setVoiceIntegrationService] = useState<VoiceIntegrationService | null>(null);
  const [realTimeService, setRealTimeService] = useState<RealTimeVoiceService | null>(null);

  useEffect(() => {
    if (tenantContext?.tenantId) {
      // Initialize API-based service
      const apiService = new VoiceIntegrationService({
        flowApiUrl: process.env.NEXT_PUBLIC_FLOW_API_URL || process.env.VOICE_API_URL || 'http://localhost:4000',
        apiKey: process.env.NEXT_PUBLIC_TENANT_API_KEY || process.env.VOICE_API_KEY || 'demo-tenant-key-1',
        tenantId: tenantContext.tenantId,
      });
      setVoiceIntegrationService(apiService);

      // Initialize real-time service
      const wsService = new RealTimeVoiceService({
        websocketUrl: process.env.NEXT_PUBLIC_FLOW_API_URL || process.env.VOICE_API_URL || 'http://localhost:4000',
        apiKey: process.env.NEXT_PUBLIC_TENANT_API_KEY || process.env.VOICE_API_KEY || 'demo-tenant-key-1',
        tenantId: tenantContext.tenantId,
      });
      setRealTimeService(wsService);

      // Subscribe to real-time events
      wsService.subscribe('voice_command_response', (response) => {
        logger.info('Real-time voice command response:', response);
        onCommandExecuted({
          success: response.success,
          data: response.data,
          error: response.error,
          tenant: tenantContext.tenantId,
          timestamp: new Date(),
        });
      });

      wsService.subscribe('lead_event', (event) => {
        logger.info('Lead event received:', event);
        // Handle lead events
      });

      wsService.subscribe('voice_event', (event) => {
        logger.info('Voice event received:', event);
        // Handle voice events
      });

      // Monitor connection status
      const checkConnection = () => {
        if (wsService.getConnectionStatus()) {
          setRealTimeStatus('connected');
        } else {
          setRealTimeStatus('disconnected');
        }
      };

      const interval = setInterval(checkConnection, 1000);
      checkConnection();

      return () => {
        clearInterval(interval);
        wsService.disconnect();
      };
    }
  }, [tenantContext, onCommandExecuted]);

  /**
   * Execute a voice command
   */
  const executeCommand = useCallback(async (
    command: VoiceCommand,
    parameters?: Record<string, any>
  ) => {
    if (!tenantContext?.tenantId) {
      onError('Ingen tenant kontekst tilgængelig');
      return;
    }

    setIsExecuting(true);
    setLastCommand(command.name);

    try {
      logger.info(`🚀 Executing voice command: ${command.name}`, { parameters });

      let response: VoiceResponse;

      if (useRealTime && realTimeService && realTimeStatus === 'connected') {
        // Use real-time WebSocket service
        const result = await realTimeService.executeVoiceCommand(command.name, parameters);
        response = {
          success: result.success,
          data: result.data,
          error: result.error,
          tenant: tenantContext.tenantId,
          timestamp: new Date(),
        };
      } else if (voiceIntegrationService) {
        // Fallback to API service
        response = await voiceIntegrationService.executeVoiceCommand(command, parameters);
      } else {
        throw new Error('No voice service available');
      }

      logger.info(`✅ Command executed successfully:`, response);
      onCommandExecuted(response);

    } catch (error) {
      logger.error(`❌ Command execution failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Ukendt fejl';
      onError(`Kommando fejlede: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [tenantContext, useRealTime, realTimeService, realTimeStatus, voiceIntegrationService, onCommandExecuted, onError]);

  /**
   * Test API connection
   */
  const testConnection = useCallback(async () => {
    if (!tenantContext?.tenantId) {
      onError('Ingen tenant kontekst tilgængelig');
      return;
    }

    setIsExecuting(true);
    setLastCommand('connection_test');

    try {
      if (useRealTime && realTimeService) {
        // Test WebSocket connection
        const status = realTimeService.getConnectionStatus();
        if (status) {
          onCommandExecuted({
            success: true,
            data: { message: 'WebSocket forbindelse virker korrekt' },
            tenant: tenantContext.tenantId,
            timestamp: new Date(),
          });
        } else {
          onError('WebSocket forbindelse fejlede');
        }
      } else if (voiceIntegrationService) {
        // Test API connection
        const isConnected = await voiceIntegrationService.testConnection();

        if (isConnected) {
          onCommandExecuted({
            success: true,
            data: { message: 'API forbindelse virker korrekt' },
            tenant: tenantContext.tenantId,
            timestamp: new Date(),
          });
        } else {
          onError('API forbindelse fejlede');
        }
      }
    } catch (error) {
      logger.error('Connection test failed:', error);
      onError('Forbindelse test fejlede');
    } finally {
      setIsExecuting(false);
    }
  }, [tenantContext, useRealTime, realTimeService, voiceIntegrationService, onCommandExecuted, onError]);

  /**
   * Quick command execution for common tasks
   */
  const executeQuickCommand = useCallback(async (commandName: string) => {
    const command: VoiceCommand = {
      id: commandName,
      name: commandName,
      description: `Quick ${commandName} command`,
      tenant_required: true,
      tenant_isolation: true,
    };

    await executeCommand(command);
  }, [executeCommand]);

  /**
   * Toggle between real-time and API modes
   */
  const toggleRealTimeMode = useCallback(() => {
    setUseRealTime(!useRealTime);
  }, [useRealTime]);

  /**
   * Manually reconnect WebSocket
   */
  const reconnectWebSocket = useCallback(() => {
    if (realTimeService) {
      realTimeService.reconnect();
      setRealTimeStatus('connecting');
    }
  }, [realTimeService]);

  return (
    <div className="bg-neutral-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-200">
          Voice Command Executor
        </h3>

        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isExecuting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <span className="text-sm text-neutral-400">
            {isExecuting ? 'Udfører...' : 'Klar'}
          </span>
        </div>
      </div>

      {/* Connection Mode Toggle */}
      <div className="bg-neutral-700 rounded p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Forbindelse Mode:</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleRealTimeMode}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                useRealTime
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-600 text-neutral-300'
              }`}
            >
              {useRealTime ? 'Real-time' : 'API'}
            </button>

            {useRealTime && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  realTimeStatus === 'connected' ? 'bg-green-500' :
                  realTimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-neutral-400">
                  {realTimeStatus === 'connected' ? 'Tilsluttet' :
                   realTimeStatus === 'connecting' ? 'Tilslutter...' : 'Afbrudt'}
                </span>
                {realTimeStatus === 'disconnected' && (
                  <button
                    onClick={reconnectWebSocket}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
                  >
                    Genopret
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-neutral-700 rounded p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-300">Status:</span>
          <button
            onClick={testConnection}
            disabled={isExecuting}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 rounded text-sm text-white transition-colors"
          >
            Test Forbindelse
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-neutral-300">Hurtige Kommandoer:</h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => executeQuickCommand('get_leads')}
            disabled={isExecuting}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 rounded text-sm text-neutral-200 transition-colors"
          >
            Hent Leads
          </button>

          <button
            onClick={() => executeQuickCommand('get_metrics')}
            disabled={isExecuting}
            className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 rounded text-sm text-neutral-200 transition-colors"
          >
            Hent Metrics
          </button>
        </div>
      </div>

      {/* Last Command Info */}
      {lastCommand && (
        <div className="bg-neutral-700 rounded p-3">
          <span className="text-sm text-neutral-400">Sidste kommando:</span>
          <span className="ml-2 text-sm text-neutral-200 font-mono">{lastCommand}</span>
        </div>
      )}

      {/* Status Messages */}
      {isExecuting && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-200">
              Udfører kommando: {lastCommand}
            </span>
          </div>
        </div>
      )}

      {/* Real-time Status Info */}
      {useRealTime && realTimeService && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
          <div className="text-sm text-blue-200">
            <div className="font-medium">Real-time Status:</div>
            <div className="text-xs mt-1">
              WebSocket: {realTimeStatus === 'connected' ? '✅ Tilsluttet' : '❌ Afbrudt'}
            </div>
            <div className="text-xs">
              Tenant: {realTimeService.getConnectionInfo().tenantId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
