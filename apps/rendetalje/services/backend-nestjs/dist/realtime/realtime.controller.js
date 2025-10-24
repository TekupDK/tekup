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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_service_1 = require("./notification.service");
const realtime_gateway_1 = require("./realtime.gateway");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const prisma_service_1 = require("../database/prisma.service");
let RealtimeController = class RealtimeController {
    constructor(notificationService, realtimeGateway, prisma) {
        this.notificationService = notificationService;
        this.realtimeGateway = realtimeGateway;
        this.prisma = prisma;
    }
    async getNotifications(req, limit = 50, unreadOnly = false) {
        return this.notificationService.getUserNotifications(req.user.id, req.user.organizationId, limit, unreadOnly);
    }
    async getUnreadCount(req) {
        const count = await this.notificationService.getUnreadCount(req.user.id, req.user.organizationId);
        return { count };
    }
    async markAsRead(notificationId, req) {
        return this.notificationService.markAsRead(notificationId, req.user.id);
    }
    async markAllAsRead(req) {
        return this.notificationService.markAllAsRead(req.user.id, req.user.organizationId);
    }
    async createNotification(notificationData, req) {
        const notification = await this.notificationService.createNotification({
            ...notificationData,
            userId: notificationData.user_id,
            organizationId: req.user.organizationId,
        });
        this.realtimeGateway.broadcastNotification(notificationData.user_id, notification);
        return notification;
    }
    async broadcastNotification(broadcastData, req) {
        let users = [];
        if (broadcastData.target === 'role' && broadcastData.role) {
            users = await this.prisma.renosUser.findMany({
                where: {
                    role: broadcastData.role,
                },
                select: { id: true },
            });
        }
        else {
            users = await this.prisma.renosUser.findMany({
                select: { id: true },
            });
        }
        if (users.length > 0) {
            const notifications = users.map((user) => ({
                organizationId: req.user.organizationId,
                userId: user.id,
                type: broadcastData.type,
                title: broadcastData.title,
                message: broadcastData.message,
                data: broadcastData.data,
            }));
            const created = await this.notificationService.createBulkNotifications(notifications);
            created.forEach((notification) => {
                this.realtimeGateway.broadcastNotification(notification.userId, notification);
            });
            return { message: `Broadcasted to ${users.length} users`, count: users.length };
        }
        return { message: 'No users found to notify', count: 0 };
    }
    async getRealtimeStatus(req) {
        const connectedUsers = this.realtimeGateway.getConnectedUsers(req.user.organizationId);
        const isUserOnline = this.realtimeGateway.isUserOnline(req.user.id);
        return {
            isConnected: isUserOnline,
            connectedUsers: connectedUsers.length,
            userOnline: isUserOnline,
        };
    }
    async getConnectedUsers(req) {
        const connectedUserIds = this.realtimeGateway.getConnectedUsers(req.user.organizationId);
        if (connectedUserIds.length === 0) {
            return { connectedUsers: [], totalConnected: 0 };
        }
        const users = await this.prisma.renosUser.findMany({
            where: {
                id: { in: connectedUserIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        return {
            connectedUsers: users,
            totalConnected: connectedUserIds.length,
        };
    }
    async broadcastJobUpdate(data, req) {
        this.realtimeGateway.broadcastJobUpdate(req.user.organizationId, data);
        return { message: 'Job update broadcasted' };
    }
    async broadcastToOrganization(data, req) {
        this.realtimeGateway.broadcastToOrganization(req.user.organizationId, data.event, data.message);
        return { message: 'Message broadcasted to organization' };
    }
    async broadcastToRole(data, req) {
        this.realtimeGateway.broadcastToRole(req.user.organizationId, data.role, data.event, data.message);
        return { message: `Message broadcasted to ${data.role} role` };
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Get)('notifications'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notifications' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notifications retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('unread_only')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Boolean]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('notifications/unread-count'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notifications count' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Unread count retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/read'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Mark notification as read' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Notification marked as read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('notifications/mark-all-read'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'All notifications marked as read',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Post)('notifications'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create custom notification' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "createNotification", null);
__decorate([
    (0, common_1.Post)('notifications/broadcast'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast notification to role or organization' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Notification broadcasted successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "broadcastNotification", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time connection status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "getRealtimeStatus", null);
__decorate([
    (0, common_1.Get)('connected-users'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of connected users' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Connected users retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "getConnectedUsers", null);
__decorate([
    (0, common_1.Post)('broadcast/job-update'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Manually broadcast job update' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "broadcastJobUpdate", null);
__decorate([
    (0, common_1.Post)('broadcast/organization'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast message to entire organization' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "broadcastToOrganization", null);
__decorate([
    (0, common_1.Post)('broadcast/role'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast message to specific role' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "broadcastToRole", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, swagger_1.ApiTags)('Real-time & Notifications'),
    (0, common_1.Controller)('realtime'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => realtime_gateway_1.RealtimeGateway))),
    __metadata("design:paramtypes", [notification_service_1.NotificationService,
        realtime_gateway_1.RealtimeGateway,
        prisma_service_1.PrismaService])
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map