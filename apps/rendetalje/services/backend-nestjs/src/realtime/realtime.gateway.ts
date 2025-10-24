import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Logger, UseGuards } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { SupabaseService } from "../supabase/supabase.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/realtime",
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn("Client connected without token");
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.organizationId = payload.organizationId;
      client.userRole = payload.role;

      // Store connection
      this.connectedUsers.set(client.userId, client);

      // Join organization room
      client.join(`org:${client.organizationId}`);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Join role-specific room
      client.join(`role:${client.userRole}`);

      this.logger.log(`User ${client.userId} connected to realtime`);

      // Notify others in organization about user coming online
      client.to(`org:${client.organizationId}`).emit("user:online", {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      // Send initial connection confirmation
      client.emit("connection:confirmed", {
        userId: client.userId,
        organizationId: client.organizationId,
        connectedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        "Authentication failed for WebSocket connection",
        error
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);

      // Notify others about user going offline
      client.to(`org:${client.organizationId}`).emit("user:offline", {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${client.userId} disconnected from realtime`);
    }
  }

  // Job Status Updates
  @SubscribeMessage("job:status_update")
  async handleJobStatusUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string; status: string; location?: any }
  ) {
    if (!client.userId || !client.organizationId) return;

    try {
      // Verify user has access to this job
      const { data: job, error } = await this.supabaseService.client
        .from("jobs")
        .select("id, organization_id, customer_id")
        .eq("id", data.jobId)
        .eq("organization_id", client.organizationId)
        .single();

      if (error || !job) {
        client.emit("error", { message: "Job not found or access denied" });
        return;
      }

      // Broadcast to organization
      this.server
        .to(`org:${client.organizationId}`)
        .emit("job:status_changed", {
          jobId: data.jobId,
          status: data.status,
          location: data.location,
          updatedBy: client.userId,
          timestamp: new Date().toISOString(),
        });

      this.logger.log(
        `Job ${data.jobId} status updated to ${data.status} by user ${client.userId}`
      );
    } catch (error) {
      this.logger.error("Error handling job status update", error);
      client.emit("error", { message: "Failed to update job status" });
    }
  }

  // Team Location Updates
  @SubscribeMessage("team:location_update")
  handleTeamLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat: number; lng: number; accuracy?: number }
  ) {
    if (!client.userId || !client.organizationId) return;

    // Broadcast location to organization (owners and admins only)
    this.server
      .to(`org:${client.organizationId}`)
      .emit("team:location_changed", {
        userId: client.userId,
        location: {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
        },
        timestamp: new Date().toISOString(),
      });
  }

  // Chat Messages
  @SubscribeMessage("chat:message")
  async handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { sessionId: string; message: string; type: "text" | "voice" }
  ) {
    if (!client.userId) return;

    // Broadcast to AI Friday or other chat participants
    this.server.to(`chat:${data.sessionId}`).emit("chat:new_message", {
      sessionId: data.sessionId,
      message: data.message,
      type: data.type,
      senderId: client.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Customer Messages
  @SubscribeMessage("customer:message")
  async handleCustomerMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { customerId: string; jobId?: string; message: string }
  ) {
    if (!client.userId || !client.organizationId) return;

    // Broadcast to organization team
    this.server
      .to(`org:${client.organizationId}`)
      .emit("customer:new_message", {
        customerId: data.customerId,
        jobId: data.jobId,
        message: data.message,
        senderId: client.userId,
        timestamp: new Date().toISOString(),
      });
  }

  // Join specific rooms
  @SubscribeMessage("room:join")
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    if (!client.userId) return;

    // Validate room access based on user role and organization
    if (this.canJoinRoom(client, data.room)) {
      client.join(data.room);
      client.emit("room:joined", { room: data.room });
      this.logger.log(`User ${client.userId} joined room ${data.room}`);
    } else {
      client.emit("error", { message: "Access denied to room" });
    }
  }

  @SubscribeMessage("room:leave")
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    client.leave(data.room);
    client.emit("room:left", { room: data.room });
  }

  // Presence and typing indicators
  @SubscribeMessage("presence:typing")
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string; isTyping: boolean }
  ) {
    if (!client.userId) return;

    client.to(data.room).emit("presence:user_typing", {
      userId: client.userId,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  // Public methods for broadcasting from other services
  broadcastJobUpdate(organizationId: string, jobData: any) {
    this.server.to(`org:${organizationId}`).emit("job:updated", {
      ...jobData,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification:new", {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToRole(
    organizationId: string,
    role: string,
    event: string,
    data: any
  ) {
    // Get all connected users with the specified role in the organization
    const targetUsers = Array.from(this.connectedUsers.values()).filter(
      (socket) =>
        socket.organizationId === organizationId && socket.userRole === role
    );

    targetUsers.forEach((socket) => {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  getConnectedUsers(organizationId: string): string[] {
    return Array.from(this.connectedUsers.values())
      .filter((socket) => socket.organizationId === organizationId)
      .map((socket) => socket.userId!)
      .filter(Boolean);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private canJoinRoom(client: AuthenticatedSocket, room: string): boolean {
    // Implement room access control logic
    if (room.startsWith("org:")) {
      const orgId = room.split(":")[1];
      return client.organizationId === orgId;
    }

    if (room.startsWith("job:")) {
      // Would need to verify job access
      return true; // Simplified for now
    }

    if (room.startsWith("chat:")) {
      // Would need to verify chat session access
      return true; // Simplified for now
    }

    return false;
  }
}
