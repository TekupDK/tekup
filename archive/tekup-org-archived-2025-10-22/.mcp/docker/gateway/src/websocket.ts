#!/usr/bin/env node

/**
 * @fileoverview MCP WebSocket Handler
 * 
 * Handles WebSocket connections for MCP protocol communication with
 * service routing, message forwarding, and connection management.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { MCPServiceDiscovery, ServiceInstance } from './service-discovery.js';
import { MCPLogger } from './logger.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface WebSocketConfig {
  enabled: boolean;
  maxConnections: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  messageTimeout: number;
  compression: boolean;
}

export interface MCPMessage {
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  jsonrpc?: string;
}

export interface ConnectionInfo {
  id: string;
  serviceId: string;
  instanceId?: string;
  clientSocket: Socket;
  serviceSocket?: WebSocket;
  connected: boolean;
  lastActivity: number;
  messageQueue: MCPMessage[];
  metadata: {
    userAgent?: string;
    ip?: string;
    headers?: Record<string, string>;
  };
}

// =============================================================================
// WEBSOCKET HANDLER CLASS
// =============================================================================

export class MCPWebSocketHandler extends EventEmitter {
  private io: SocketServer;
  private serviceDiscovery: MCPServiceDiscovery;
  private logger: MCPLogger;
  private config: WebSocketConfig;
  
  private connections: Map<string, ConnectionInfo>;
  private serviceConnections: Map<string, WebSocket[]>;
  private heartbeatInterval?: NodeJS.Timeout;
  
  constructor(io: SocketServer, serviceDiscovery: MCPServiceDiscovery, logger: MCPLogger) {
    super();
    
    this.io = io;
    this.serviceDiscovery = serviceDiscovery;
    this.logger = logger.createChild('websocket');
    
    // Default configuration
    this.config = {
      enabled: true,
      maxConnections: 1000,
      heartbeatInterval: 30000,
      connectionTimeout: 60000,
      messageTimeout: 30000,
      compression: true
    };
    
    this.connections = new Map();
    this.serviceConnections = new Map();
    
    this.setupSocketHandlers();
    this.startHeartbeat();
  }
  
  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleClientConnection(socket);
    });
    
    // Handle service discovery events
    this.serviceDiscovery.on('serviceRemoved', (serviceId: string, instanceId: string) => {
      this.handleServiceRemoved(serviceId, instanceId);
    });
    
    this.serviceDiscovery.on('serviceHealthChanged', (serviceId: string, instanceId: string, healthy: boolean) => {
      if (!healthy) {
        this.handleServiceUnhealthy(serviceId, instanceId);
      }
    });
  }
  
  /**
   * Handle new client connection
   */
  private handleClientConnection(clientSocket: Socket): void {
    try {
      const connectionId = this.generateConnectionId();
      const serviceId = clientSocket.handshake.query.service as string;
      
      if (!serviceId) {
        this.logger.warn('WebSocket connection rejected - no service specified', {
          socketId: clientSocket.id
        });
        clientSocket.emit('error', {
          code: -32600,
          message: 'Service ID is required',
          data: { socketId: clientSocket.id }
        });
        clientSocket.disconnect();
        return;
      }
      
      // Check if service exists
      if (!this.serviceDiscovery.hasService(serviceId)) {
        this.logger.warn('WebSocket connection rejected - service not found', {
          serviceId,
          socketId: clientSocket.id
        });
        clientSocket.emit('error', {
          code: -32601,
          message: 'Service not found',
          data: { serviceId }
        });
        clientSocket.disconnect();
        return;
      }
      
      // Check connection limits
      if (this.connections.size >= this.config.maxConnections) {
        this.logger.warn('WebSocket connection rejected - connection limit exceeded', {
          currentConnections: this.connections.size,
          limit: this.config.maxConnections
        });
        clientSocket.emit('error', {
          code: -32000,
          message: 'Connection limit exceeded'
        });
        clientSocket.disconnect();
        return;
      }
      
      // Create connection info
      const connectionInfo: ConnectionInfo = {
        id: connectionId,
        serviceId,
        clientSocket,
        connected: true,
        lastActivity: Date.now(),
        messageQueue: [],
        metadata: {
          userAgent: clientSocket.handshake.headers['user-agent'],
          ip: clientSocket.handshake.address,
          headers: clientSocket.handshake.headers as Record<string, string>
        }
      };
      
      this.connections.set(connectionId, connectionInfo);
      
      // Setup client socket handlers
      this.setupClientSocketHandlers(clientSocket, connectionInfo);
      
      // Establish service connection
      this.establishServiceConnection(connectionInfo);
      
      this.logger.info('WebSocket client connected', {
        connectionId,
        serviceId,
        totalConnections: this.connections.size
      });
      
      this.emit('clientConnected', { connectionId, serviceId });
      
    } catch (error) {
      this.logger.error('Error handling client connection', {
        socketId: clientSocket.id,
        error: error.message
      });
      clientSocket.disconnect();
    }
  }
  
  /**
   * Setup client socket event handlers
   */
  private setupClientSocketHandlers(clientSocket: Socket, connectionInfo: ConnectionInfo): void {
    // Handle MCP messages from client
    clientSocket.on('mcp_message', (message: MCPMessage) => {
      this.handleClientMessage(connectionInfo, message);
    });
    
    // Handle ping/pong for heartbeat
    clientSocket.on('ping', () => {
      connectionInfo.lastActivity = Date.now();
      clientSocket.emit('pong');
    });
    
    // Handle disconnection
    clientSocket.on('disconnect', (reason) => {
      this.handleClientDisconnection(connectionInfo, reason);
    });
    
    // Handle errors
    clientSocket.on('error', (error) => {
      this.logger.error('Client socket error', {
        connectionId: connectionInfo.id,
        error: error.message
      });
      this.emit('clientError', { connectionId: connectionInfo.id, error });
    });
  }
  
  /**
   * Establish connection to MCP service
   */
  private async establishServiceConnection(connectionInfo: ConnectionInfo): Promise<void> {
    try {
      // Get service instance via load balancer
      const instance = this.serviceDiscovery.getServiceInstances(connectionInfo.serviceId)?.[0];
      if (!instance) {
        throw new Error(`No instances available for service: ${connectionInfo.serviceId}`);
      }
      
      connectionInfo.instanceId = instance.instanceId;
      
      // Create WebSocket connection to service
      const wsUrl = this.buildWebSocketUrl(instance);
      const serviceSocket = new WebSocket(wsUrl, {
        handshakeTimeout: this.config.connectionTimeout,
        headers: {
          'X-Forwarded-For': connectionInfo.metadata.ip || 'unknown',
          'X-Gateway-Connection-Id': connectionInfo.id,
          'User-Agent': 'MCP-Gateway/1.0.0'
        }
      });
      
      connectionInfo.serviceSocket = serviceSocket;
      
      // Setup service socket handlers
      this.setupServiceSocketHandlers(connectionInfo, serviceSocket);
      
      // Track service connections
      const serviceConnections = this.serviceConnections.get(connectionInfo.serviceId) || [];
      serviceConnections.push(serviceSocket);
      this.serviceConnections.set(connectionInfo.serviceId, serviceConnections);
      
      this.logger.info('Service WebSocket connection established', {
        connectionId: connectionInfo.id,
        serviceId: connectionInfo.serviceId,
        instanceId: connectionInfo.instanceId,
        wsUrl
      });
      
    } catch (error) {
      this.logger.error('Failed to establish service connection', {
        connectionId: connectionInfo.id,
        serviceId: connectionInfo.serviceId,
        error: error.message
      });
      
      connectionInfo.clientSocket.emit('error', {
        code: -32000,
        message: 'Service connection failed',
        data: { error: error.message }
      });
      
      connectionInfo.clientSocket.disconnect();
      this.cleanupConnection(connectionInfo.id);
    }
  }
  
  /**
   * Setup service socket event handlers
   */
  private setupServiceSocketHandlers(connectionInfo: ConnectionInfo, serviceSocket: WebSocket): void {
    serviceSocket.on('open', () => {
      this.logger.debug('Service WebSocket opened', {
        connectionId: connectionInfo.id,
        serviceId: connectionInfo.serviceId
      });
      
      // Process any queued messages
      this.processMessageQueue(connectionInfo);
    });
    
    serviceSocket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as MCPMessage;
        this.handleServiceMessage(connectionInfo, message);
      } catch (error) {
        this.logger.error('Failed to parse service message', {
          connectionId: connectionInfo.id,
          error: error.message
        });
      }
    });
    
    serviceSocket.on('close', (code: number, reason: Buffer) => {
      this.logger.warn('Service WebSocket closed', {
        connectionId: connectionInfo.id,
        code,
        reason: reason.toString()
      });
      
      this.handleServiceDisconnection(connectionInfo, code, reason.toString());
    });
    
    serviceSocket.on('error', (error: Error) => {
      this.logger.error('Service WebSocket error', {
        connectionId: connectionInfo.id,
        error: error.message
      });
      
      this.handleServiceError(connectionInfo, error);
    });
  }
  
  /**
   * Handle message from client
   */
  private handleClientMessage(connectionInfo: ConnectionInfo, message: MCPMessage): void {
    try {
      connectionInfo.lastActivity = Date.now();
      
      this.logger.debug('Received client message', {
        connectionId: connectionInfo.id,
        method: message.method,
        id: message.id
      });
      
      // Validate message format
      if (!this.isValidMCPMessage(message)) {
        connectionInfo.clientSocket.emit('error', {
          code: -32600,
          message: 'Invalid Request',
          id: message.id
        });
        return;
      }
      
      // Forward to service
      if (connectionInfo.serviceSocket?.readyState === WebSocket.OPEN) {
        connectionInfo.serviceSocket.send(JSON.stringify(message));
      } else {
        // Queue message if service connection not ready
        connectionInfo.messageQueue.push(message);
        
        this.logger.debug('Message queued - service not ready', {
          connectionId: connectionInfo.id,
          queueLength: connectionInfo.messageQueue.length
        });
      }
      
      this.emit('messageFromClient', {
        connectionId: connectionInfo.id,
        serviceId: connectionInfo.serviceId,
        message
      });
      
    } catch (error) {
      this.logger.error('Error handling client message', {
        connectionId: connectionInfo.id,
        error: error.message
      });
      
      connectionInfo.clientSocket.emit('error', {
        code: -32603,
        message: 'Internal error',
        id: message.id
      });
    }
  }
  
  /**
   * Handle message from service
   */
  private handleServiceMessage(connectionInfo: ConnectionInfo, message: MCPMessage): void {
    try {
      this.logger.debug('Received service message', {
        connectionId: connectionInfo.id,
        method: message.method,
        id: message.id
      });
      
      // Forward to client
      if (connectionInfo.clientSocket.connected) {
        connectionInfo.clientSocket.emit('mcp_message', message);
      } else {
        this.logger.warn('Cannot forward message - client disconnected', {
          connectionId: connectionInfo.id
        });
      }
      
      this.emit('messageFromService', {
        connectionId: connectionInfo.id,
        serviceId: connectionInfo.serviceId,
        message
      });
      
    } catch (error) {
      this.logger.error('Error handling service message', {
        connectionId: connectionInfo.id,
        error: error.message
      });
    }
  }
  
  /**
   * Process queued messages
   */
  private processMessageQueue(connectionInfo: ConnectionInfo): void {
    if (connectionInfo.messageQueue.length > 0 && 
        connectionInfo.serviceSocket?.readyState === WebSocket.OPEN) {
      
      this.logger.info('Processing message queue', {
        connectionId: connectionInfo.id,
        queueLength: connectionInfo.messageQueue.length
      });
      
      while (connectionInfo.messageQueue.length > 0) {
        const message = connectionInfo.messageQueue.shift()!;
        connectionInfo.serviceSocket.send(JSON.stringify(message));
      }
    }
  }
  
  /**
   * Handle client disconnection
   */
  private handleClientDisconnection(connectionInfo: ConnectionInfo, reason: string): void {
    this.logger.info('Client disconnected', {
      connectionId: connectionInfo.id,
      serviceId: connectionInfo.serviceId,
      reason
    });
    
    this.cleanupConnection(connectionInfo.id);
    
    this.emit('clientDisconnected', {
      connectionId: connectionInfo.id,
      serviceId: connectionInfo.serviceId,
      reason
    });
  }
  
  /**
   * Handle service disconnection
   */
  private handleServiceDisconnection(connectionInfo: ConnectionInfo, code: number, reason: string): void {
    this.logger.warn('Service disconnected', {
      connectionId: connectionInfo.id,
      serviceId: connectionInfo.serviceId,
      code,
      reason
    });
    
    // Attempt reconnection or notify client
    connectionInfo.clientSocket.emit('service_disconnected', {
      code,
      reason,
      reconnecting: true
    });
    
    // Try to reestablish connection
    setTimeout(() => {
      if (this.connections.has(connectionInfo.id)) {
        this.establishServiceConnection(connectionInfo);
      }
    }, 5000);
  }
  
  /**
   * Handle service error
   */
  private handleServiceError(connectionInfo: ConnectionInfo, error: Error): void {
    this.logger.error('Service connection error', {
      connectionId: connectionInfo.id,
      serviceId: connectionInfo.serviceId,
      error: error.message
    });
    
    connectionInfo.clientSocket.emit('service_error', {
      error: error.message,
      code: -32000
    });
    
    this.emit('serviceError', {
      connectionId: connectionInfo.id,
      serviceId: connectionInfo.serviceId,
      error
    });
  }
  
  /**
   * Handle service removed from discovery
   */
  private handleServiceRemoved(serviceId: string, instanceId: string): void {
    // Find affected connections
    const affectedConnections = Array.from(this.connections.values())
      .filter(conn => conn.serviceId === serviceId && conn.instanceId === instanceId);
    
    for (const connection of affectedConnections) {
      connection.clientSocket.emit('service_unavailable', {
        serviceId,
        instanceId,
        message: 'Service instance removed'
      });
      
      connection.clientSocket.disconnect();
    }
    
    this.logger.info('Disconnected clients due to service removal', {
      serviceId,
      instanceId,
      affectedConnections: affectedConnections.length
    });
  }
  
  /**
   * Handle service becoming unhealthy
   */
  private handleServiceUnhealthy(serviceId: string, instanceId: string): void {
    const affectedConnections = Array.from(this.connections.values())
      .filter(conn => conn.serviceId === serviceId && conn.instanceId === instanceId);
    
    for (const connection of affectedConnections) {
      // Try to reconnect to a healthy instance
      this.establishServiceConnection(connection);
    }
    
    this.logger.info('Attempting reconnection due to unhealthy service', {
      serviceId,
      instanceId,
      affectedConnections: affectedConnections.length
    });
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeatCheck();
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Perform heartbeat check
   */
  private performHeartbeatCheck(): void {
    const now = Date.now();
    const timeout = this.config.connectionTimeout;
    
    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastActivity > timeout) {
        this.logger.warn('Connection timed out', {
          connectionId,
          lastActivity: new Date(connection.lastActivity).toISOString(),
          timeoutMs: timeout
        });
        
        connection.clientSocket.emit('timeout');
        connection.clientSocket.disconnect();
        this.cleanupConnection(connectionId);
      }
    }
  }
  
  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  /**
   * Build WebSocket URL for service
   */
  private buildWebSocketUrl(instance: ServiceInstance): string {
    const protocol = instance.secure ? 'wss' : 'ws';
    return `${protocol}://${instance.host}:${instance.port}${instance.path || '/'}`;
  }
  
  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Validate MCP message format
   */
  private isValidMCPMessage(message: any): message is MCPMessage {
    if (!message || typeof message !== 'object') return false;
    
    // Check for either request or response format
    const isRequest = message.method && (message.id !== undefined);
    const isResponse = (message.result !== undefined || message.error !== undefined) && message.id !== undefined;
    const isNotification = message.method && message.id === undefined;
    
    return isRequest || isResponse || isNotification;
  }
  
  /**
   * Clean up connection resources
   */
  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Close service socket
    if (connection.serviceSocket) {
      connection.serviceSocket.close();
    }
    
    // Remove from service connections tracking
    if (connection.serviceId) {
      const serviceConnections = this.serviceConnections.get(connection.serviceId);
      if (serviceConnections && connection.serviceSocket) {
        const index = serviceConnections.indexOf(connection.serviceSocket);
        if (index > -1) {
          serviceConnections.splice(index, 1);
        }
        if (serviceConnections.length === 0) {
          this.serviceConnections.delete(connection.serviceId);
        }
      }
    }
    
    this.connections.delete(connectionId);
    
    this.logger.debug('Connection cleaned up', {
      connectionId,
      remainingConnections: this.connections.size
    });
  }
  
  /**
   * Get connection statistics
   */
  getStatistics(): any {
    const serviceStats = new Map<string, number>();
    
    for (const connection of this.connections.values()) {
      const current = serviceStats.get(connection.serviceId) || 0;
      serviceStats.set(connection.serviceId, current + 1);
    }
    
    return {
      totalConnections: this.connections.size,
      maxConnections: this.config.maxConnections,
      connectionsByService: Object.fromEntries(serviceStats),
      config: this.config
    };
  }
  
  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('WebSocket configuration updated', { config: this.config });
  }
  
  /**
   * Shutdown WebSocket handler
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      connection.clientSocket.emit('server_shutdown');
      connection.clientSocket.disconnect();
      this.cleanupConnection(connectionId);
    }
    
    this.logger.info('WebSocket handler shutdown complete');
  }
}

export default MCPWebSocketHandler;