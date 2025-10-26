'use client';

/**
 * Jarvis Enhanced Voice Control Component
 *
 * Provides multimodal voice interface with screen analysis and visual feedback
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JarvisVoiceMockService, MultimodalVoiceRequest, MultimodalVoiceResponse } from '../services/jarvis-voice-mock.service';
import { getJarvisMode } from '../config/jarvis';
// import { createLogger } from '@tekup/shared';
const createLogger = (name: string) => ({
  info: (msg: string, ...args: any[]) => console.log(`[${name}] INFO:`, msg, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[${name}] ERROR:`, msg, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[${name}] WARN:`, msg, ...args)
});

const logger = createLogger('jarvis-voice-control');

interface JarvisVoiceControlProps {
  tenantId: string;
  userId: string;
  apiKey: string;
  flowApiUrl: string;
  onResponse?: (response: MultimodalVoiceResponse) => void;
  enableScreenAnalysis?: boolean;
}

export const JarvisVoiceControl: React.FC<JarvisVoiceControlProps> = ({
  tenantId,
  userId,
  apiKey,
  flowApiUrl,
  onResponse,
  enableScreenAnalysis = true
}) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<MultimodalVoiceResponse | null>(null);
  const [jarvisHealth, setJarvisHealth] = useState<any>(null);
  const [screenAnalysisEnabled, setScreenAnalysisEnabled] = useState(enableScreenAnalysis);

  // Refs
  const jarvisService = useRef<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Initialize Jarvis service
  useEffect(() => {
    const initializeJarvis = async () => {
      try {
        logger.info('🤖 Initializing Jarvis Voice Control...');

        const mode = getJarvisMode();
        logger.info(`Jarvis mode: ${mode}`);
        if (mode === 'real') {
          const mod: any = await import('../services/jarvis-voice-real.service');
          const RealCtor = (mod && (mod.JarvisVoiceService || mod.default)) as any;
          const createFn = (mod && mod.createJarvisVoiceService) as any;
          if (typeof RealCtor === 'function') {
            jarvisService.current = new RealCtor({
              flowApiUrl,
              apiKey,
              tenantId
            });
          } else if (typeof createFn === 'function') {
            jarvisService.current = createFn({
              flowApiUrl,
              apiKey,
              tenantId
            });
          } else {
            logger.warn('Real Jarvis service not found, falling back to mock');
            jarvisService.current = new JarvisVoiceMockService({
              flowApiUrl,
              apiKey,
              tenantId
            });
          }
          setScreenAnalysisEnabled(enableScreenAnalysis);
        } else {
          jarvisService.current = new JarvisVoiceMockService({
            flowApiUrl,
            apiKey,
            tenantId
          });
          setScreenAnalysisEnabled(mode === 'mock' ? enableScreenAnalysis : false);
        }

        // Check health status
        const health = await jarvisService.current.getJarvisHealthStatus();
        setJarvisHealth(health);

        logger.info('✅ Jarvis Voice Control initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize Jarvis:', error);
      }
    };

    initializeJarvis();

    // Cleanup on unmount
    return () => {
      if (jarvisService.current) {
        jarvisService.current.cleanup();
      }
    };
  }, [flowApiUrl, apiKey, tenantId]);

  // Start voice recording
  const startListening = useCallback(async () => {
    try {
      logger.info('🎤 Starting voice recording...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        processVoiceCommand();
      };

      mediaRecorder.current.start();
      setIsListening(true);

    } catch (error) {
      logger.error('❌ Failed to start recording:', error);
    }
  }, []);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (mediaRecorder.current && isListening) {
      logger.info('🛑 Stopping voice recording...');
      mediaRecorder.current.stop();
      setIsListening(false);

      // Stop all audio tracks
      const stream = mediaRecorder.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [isListening]);

  // Capture screen for visual context
  const captureScreen = useCallback(async (): Promise<ArrayBuffer | undefined> => {
    if (!screenAnalysisEnabled) {
      return undefined;
    }

    try {
      logger.info('📸 Capturing screen for visual context...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);

          // Stop the stream
          stream.getTracks().forEach(track => track.stop());

          canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(resolve);
            } else {
              resolve(undefined);
            }
          }, 'image/png');
        };
      });

    } catch (error) {
      logger.warn('⚠️ Screen capture failed (may not be supported):', error);
      return undefined;
    }
  }, [screenAnalysisEnabled]);

  // Process voice command with Jarvis
  const processVoiceCommand = useCallback(async () => {
    if (!jarvisService.current || audioChunks.current.length === 0) {
      return;
    }

    try {
      setIsProcessing(true);
      logger.info('🎭 Processing voice command with Jarvis...');

      // Convert audio to ArrayBuffer
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const audioBuffer = await audioBlob.arrayBuffer();

      // Capture screen if enabled
      const screenCapture = await captureScreen();

      // Create multimodal request
      const request: MultimodalVoiceRequest = {
        audioData: audioBuffer,
        screenCapture,
        contextData: {
          currentPage: window.location.pathname,
          conversationHistory: lastResponse ? [lastResponse] : []
        },
        tenantId,
        userId
      };

      // Process with Jarvis
      const response = await jarvisService.current.processMultimodalCommand(request);

      setLastResponse(response);
      onResponse?.(response);

      // Play audio response if available
      if (response.audioResponse) {
        await playAudioResponse(response.audioResponse);
      }

      logger.info('✅ Voice command processed successfully');

    } catch (error) {
      logger.error('❌ Failed to process voice command:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [tenantId, userId, lastResponse, onResponse, captureScreen]);

  // Play audio response
  const playAudioResponse = useCallback(async (audioData: ArrayBuffer) => {
    try {
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();

      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (error) {
      logger.error('❌ Failed to play audio response:', error);
    }
  }, []);

  // Toggle voice recording
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Render health status indicator
  const renderHealthStatus = () => {
    if (!jarvisHealth) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm">Initialiserer...</span>
        </div>
      );
    }

    const isHealthy = jarvisHealth.jarvis && jarvisHealth.multimodal;

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-sm text-gray-700">
          Jarvis {isHealthy ? 'Aktiv' : 'Ikke tilgængelig'}
        </span>
        {jarvisHealth.vision && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Vision</span>
        )}
        {jarvisHealth.audio && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Audio</span>
        )}
      </div>
    );
  };

  // Render visual insights
  const renderVisualInsights = () => {
    if (!lastResponse?.visualInsights) {
      return null;
    }

    const { objects, text, actionItems } = lastResponse.visualInsights;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🔍 Skærm Analyse</h4>

        {objects.length > 0 && (
          <div className="mb-2">
            <span className="text-sm font-medium">Objekter: </span>
            <span className="text-sm text-gray-700">
              {objects.map(obj => obj.label).join(', ')}
            </span>
          </div>
        )}

        {text.length > 0 && (
          <div className="mb-2">
            <span className="text-sm font-medium">Tekst fundet: </span>
            <span className="text-sm text-gray-700">
              {text.length} tekst elementer
            </span>
          </div>
        )}

        {actionItems && actionItems.length > 0 && (
          <div>
            <span className="text-sm font-medium">Handlinger: </span>
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {actionItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🤖 Jarvis AI Assistant</h3>
        {renderHealthStatus()}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={toggleListening}
          disabled={isProcessing || !jarvisHealth?.jarvis}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          {isListening ? '🛑' : '🎤'}
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-700">
            {isProcessing ? 'Behandler...' : isListening ? 'Lytter...' : 'Klar til kommando'}
          </span>
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-1"></div>
          )}
        </div>
      </div>

      {/* Screen Analysis Toggle */}
      <div className="flex items-center justify-center mb-4">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={screenAnalysisEnabled}
            onChange={(e) => setScreenAnalysisEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Aktiver skærm analyse</span>
        </label>
      </div>

      {/* Last Response */}
      {lastResponse && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💬 Seneste Svar</h4>
          <p className="text-gray-700 text-sm mb-2">{lastResponse.textResponse}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Sikkerhed: {(lastResponse.confidence * 100).toFixed(0)}%</span>
            {lastResponse.audioResponse && (
              <span className="text-green-600">🔊 Audio genereret</span>
            )}
          </div>

          {/* Suggested Actions */}
          {lastResponse.suggestedActions && lastResponse.suggestedActions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Foreslåede handlinger:</h5>
              <div className="flex flex-wrap gap-2">
                {lastResponse.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      // Execute suggested action
                      logger.info('Executing action:', action.command);
                    }}
                  >
                    {action.description}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Insights */}
      {renderVisualInsights()}

      {      /* Instructions */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>Tryk på mikrofon knappen og sig en kommando på dansk eller engelsk.</p>
        <p>Dette er en MOCK version af Jarvis - den fulde AI kommer snart!</p>
        <p className="text-blue-600 font-medium">✨ Test alle features uden tunge AI dependencies</p>
      </div>
    </div>
  );
};

export default JarvisVoiceControl;
