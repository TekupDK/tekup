"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const supabase_service_1 = require("../supabase/supabase.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwtService, supabaseService) {
        this.jwtService = jwtService;
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
        this.connectedUsers = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                this.logger.warn('Client connected without token');
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            client.organizationId = payload.organizationId;
            client.userRole = payload.role;
            this.connectedUsers.set(client.userId, client);
            client.join(`org:${client.organizationId}`);
            client.join(`user:${client.userId}`);
            client.join(`role:${client.userRole}`);
            this.logger.log(`User ${client.userId} connected to realtime`);
            client.to(`org:${client.organizationId}`).emit('user:online', {
                userId: client.userId,
                timestamp: new Date().toISOString(),
            });
            client.emit('connection:confirmed', {
                userId: client.userId,
                organizationId: client.organizationId,
                connectedAt: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error('Authentication failed for WebSocket connection', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            client.to(`org:${client.organizationId}`).emit('user:offline', {
                userId: client.userId,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`User ${client.userId} disconnected from realtime`);
        }
    }
    async handleJobStatusUpdate(client, data) {
        if (!client.userId || !client.organizationId)
            return;
        try {
            const { data: job, error } = await this.supabaseService.client
                .from('jobs')
                .select('id, organization_id, customer_id')
                .eq('id', data.jobId)
                .eq('organization_id', client.organizationId)
                .single();
            if (error || !job) {
                client.emit('error', { message: 'Job not found or access denied' });
                return;
            }
            this.server.to(`org:${client.organizationId}`).emit('job:status_changed', {
                jobId: data.jobId,
                status: data.status,
                location: data.location,
                updatedBy: client.userId,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`Job ${data.jobId} status updated to ${data.status} by user ${client.userId}`);
        }
        catch (error) {
            this.logger.error('Error handling job status update', error);
            client.emit('error', { message: 'Failed to update job status' });
        }
    }
    handleTeamLocationUpdate(client, data) {
        if (!client.userId || !client.organizationId)
            return;
        this.server.to(`org:${client.organizationId}`).emit('team:location_changed', {
            userId: client.userId,
            location: {
                lat: data.lat,
                lng: data.lng,
                accuracy: data.accuracy,
            },
            timestamp: new Date().toISOString(),
        });
    }
    async handleChatMessage(client, data) {
        if (!client.userId)
            return;
        this.server.to(`chat:${data.sessionId}`).emit('chat:new_message', {
            sessionId: data.sessionId,
            message: data.message,
            type: data.type,
            senderId: client.userId,
            timestamp: new Date().toISOString(),
        });
    }
    async handleCustomerMessage(client, data) {
        if (!client.userId || !client.organizationId)
            return;
        this.server.to(`org:${client.organizationId}`).emit('customer:new_message', {
            customerId: data.customerId,
            jobId: data.jobId,
            message: data.message,
            senderId: client.userId,
            timestamp: new Date().toISOString(),
        });
    }
    handleJoinRoom(client, data) {
        if (!client.userId)
            return;
        if (this.canJoinRoom(client, data.room)) {
            client.join(data.room);
            client.emit('room:joined', { room: data.room });
            this.logger.log(`User ${client.userId} joined room ${data.room}`);
        }
        else {
            client.emit('error', { message: 'Access denied to room' });
        }
    }
    handleLeaveRoom(client, data) {
        client.leave(data.room);
        client.emit('room:left', { room: data.room });
    }
    handleTyping(client, data) {
        if (!client.userId)
            return;
        client.to(data.room).emit('presence:user_typing', {
            userId: client.userId,
            isTyping: data.isTyping,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastJobUpdate(organizationId, jobData) {
        this.server.to(`org:${organizationId}`).emit('job:updated', {
            ...jobData,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastNotification(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification:new', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastToOrganization(organizationId, event, data) {
        this.server.to(`org:${organizationId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastToRole(organizationId, role, event, data) {
        const targetUsers = Array.from(this.connectedUsers.values())
            .filter(socket => socket.organizationId === organizationId && socket.userRole === role);
        targetUsers.forEach(socket => {
            socket.emit(event, {
                ...data,
                timestamp: new Date().toISOString(),
            });
        });
    }
    getConnectedUsers(organizationId) {
        return Array.from(this.connectedUsers.values())
            .filter(socket => socket.organizationId === organizationId)
            .map(socket => socket.userId)
            .filter(Boolean);
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    canJoinRoom(client, room) {
        if (room.startsWith('org:')) {
            const orgId = room.split(':')[1];
            return client.organizationId === orgId;
        }
        if (room.startsWith('job:')) {
            return true;
        }
        if (room.startsWith('chat:')) {
            return true;
        }
        return false;
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('job:status_update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleJobStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('team:location_update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleTeamLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('customer:message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleCustomerMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('room:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('room:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleTyping", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        supabase_service_1.SupabaseService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map