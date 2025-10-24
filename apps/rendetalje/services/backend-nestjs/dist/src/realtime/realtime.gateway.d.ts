import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    organizationId?: string;
    userRole?: string;
}
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly supabaseService;
    server: Server;
    private readonly logger;
    private connectedUsers;
    constructor(jwtService: JwtService, supabaseService: SupabaseService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJobStatusUpdate(client: AuthenticatedSocket, data: {
        jobId: string;
        status: string;
        location?: any;
    }): Promise<void>;
    handleTeamLocationUpdate(client: AuthenticatedSocket, data: {
        lat: number;
        lng: number;
        accuracy?: number;
    }): void;
    handleChatMessage(client: AuthenticatedSocket, data: {
        sessionId: string;
        message: string;
        type: 'text' | 'voice';
    }): Promise<void>;
    handleCustomerMessage(client: AuthenticatedSocket, data: {
        customerId: string;
        jobId?: string;
        message: string;
    }): Promise<void>;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        room: string;
    }): void;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        room: string;
    }): void;
    handleTyping(client: AuthenticatedSocket, data: {
        room: string;
        isTyping: boolean;
    }): void;
    broadcastJobUpdate(organizationId: string, jobData: any): void;
    broadcastNotification(userId: string, notification: any): void;
    broadcastToOrganization(organizationId: string, event: string, data: any): void;
    broadcastToRole(organizationId: string, role: string, event: string, data: any): void;
    getConnectedUsers(organizationId: string): string[];
    isUserOnline(userId: string): boolean;
    private canJoinRoom;
}
export {};
