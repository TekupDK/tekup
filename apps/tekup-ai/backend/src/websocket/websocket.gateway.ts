import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/chat',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private configService: ConfigService,
    private aiService: AiService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate user via JWT token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('app.jwt.secret'),
      });

      if (!payload?.sub) {
        this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store user info
      client.userId = payload.sub;
      this.connectedUsers.set(payload.sub, client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Successfully connected to TekupAI',
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Handle chat message from client
   */
  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      conversationId?: string;
      message: string;
      model?: string;
      temperature?: number;
    },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      this.logger.log(`Received message from user ${client.userId}`);

      // Emit typing indicator
      client.emit('chat:typing', { conversationId: data.conversationId });

      // Send message to AI service (non-streaming for WebSocket)
      const response = await this.aiService.sendMessage(client.userId, {
        conversationId: data.conversationId,
        message: data.message,
        model: data.model,
        temperature: data.temperature,
      });

      // Emit response back to client
      client.emit('chat:response', {
        conversationId: response.conversationId,
        messageId: response.messageId,
        content: response.content,
        model: response.model,
        tokens: response.tokens,
      });

      // Stop typing indicator
      client.emit('chat:typing-stop', { conversationId: data.conversationId });
    } catch (error) {
      this.logger.error('Error handling chat message:', error);
      client.emit('chat:error', {
        message: error.message || 'Failed to process message',
      });
      client.emit('chat:typing-stop', { conversationId: data.conversationId });
    }
  }

  /**
   * Handle user typing indicator
   */
  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    // Broadcast typing to other users in the same conversation (if multi-user)
    // For now, just acknowledge
    client.emit('chat:typing-ack', { conversationId: data.conversationId });
  }

  /**
   * Join a conversation room
   */
  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.userId} joined conversation ${data.conversationId}`,
    );
    client.emit('conversation:joined', { conversationId: data.conversationId });
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.userId} left conversation ${data.conversationId}`,
    );
    client.emit('conversation:left', { conversationId: data.conversationId });
  }

  /**
   * Ping/pong for keep-alive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  /**
   * Broadcast message to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * Broadcast message to a conversation room
   */
  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
