import { io, Socket } from 'socket.io-client';
import { VoiceCommandRequest, VoiceCommandResponse } from '@tekup/api-client';
import { VoiceEvent, LeadEvent, IntegrationEvent, createLogger } from '@tekup/shared';
const logger = createLogger('real-time-voice-service');

export interface RealTimeVoiceConfig {
  websocketUrl: string;
  apiKey: string;
  tenantId: string;
}

export interface VoiceCommandResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export type EventHandler<T = any> = (event: T) => void;

export class RealTimeVoiceService {

  private socket: Socket | null = null;
  private config: RealTimeVoiceConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(config: RealTimeVoiceConfig) {
    this.config = config;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect() {
    try {
      logger.info('🔌 Connecting to WebSocket server...');

      this.socket = io(`${this.config.websocketUrl}/events`, {
        extraHeaders: {
          'x-tenant-key': this.config.apiKey,
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.setupSocketEventHandlers();

    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupSocketEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('✅ Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      logger.info('🔌 Disconnected from WebSocket server');
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      logger.info('🎉 WebSocket connection established:', data);
    });

    // Handle voice command responses
    this.socket.on('voice_command_response', (response: VoiceCommandResponse) => {
      logger.info('📥 Voice command response received:', response);
      this.triggerEventHandlers('voice_command_response', response);
    });

    // Handle lead events
    this.socket.on('lead_event', (event: LeadEvent) => {
      logger.info('📥 Lead event received:', event);
      this.triggerEventHandlers('lead_event', event);
    });

    // Handle voice events
    this.socket.on('voice_event', (event: VoiceEvent) => {
      logger.info('📥 Voice event received:', event);
      this.triggerEventHandlers('voice_event', event);
    });

    // Handle integration events
    this.socket.on('integration_event', (event: IntegrationEvent) => {
      logger.info('📥 Integration event received:', event);
      this.triggerEventHandlers('integration_event', event);
    });

    // Handle general app events
    this.socket.on('app_event', (event: any) => {
      logger.info('📥 App event received:', event);
      this.triggerEventHandlers('app_event', event);
    });
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      logger.info(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Execute a voice command in real-time
   */
  async executeVoiceCommand(
    command: string,
    parameters?: Record<string, any>
  ): Promise<VoiceCommandResult> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    const request: VoiceCommandRequest = {
      command,
      parameters,
      tenantId: this.config.tenantId,
    };

    logger.info(`🎯 Executing voice command via WebSocket: ${command}`, { parameters });

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not available'));
        return;
      }

      // Set up one-time response handler
      const responseHandler = (response: VoiceCommandResponse) => {
        if (response.command === command) {
          this.socket?.off('voice_command_response', responseHandler);

          const result: VoiceCommandResult = {
            success: response.success,
            data: response.data,
            error: response.error,
          };

          resolve(result);
        }
      };

      this.socket.on('voice_command_response', responseHandler);

      // Send the command
      this.socket.emit('execute_voice_command', request);

      // Set timeout for response
      setTimeout(() => {
        this.socket?.off('voice_command_response', responseHandler);
        reject(new Error('Voice command execution timeout'));
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Subscribe to events
   */
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): string {
    const subscriptionId = this.generateSubscriptionId();

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)!.push(handler);

    logger.info(`📥 Subscribed to ${eventType} events (ID: ${subscriptionId})`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;

    const index = handlers.findIndex(h => h === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      logger.info(`📤 Unsubscribed from ${eventType} events`);
    }
  }

  /**
   * Unsubscribe by subscription ID
   */
  unsubscribeById(subscriptionId: string): void {
    // For now, we'll need to track subscription IDs separately
    // This is a simplified implementation
    logger.info(`📤 Unsubscribed by ID: ${subscriptionId}`);
  }

  /**
   * Trigger event handlers for a specific event type
   */
  private triggerEventHandlers<T>(eventType: string, event: T) {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Manually disconnect
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Manually reconnect
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      websocketUrl: this.config.websocketUrl,
      tenantId: this.config.tenantId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
