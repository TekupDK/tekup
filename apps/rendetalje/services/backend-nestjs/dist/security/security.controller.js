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
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const audit_service_1 = require("./audit.service");
let SecurityController = class SecurityController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getAuditLogs(user, userId, action, entityType, startDate, endDate, limit) {
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (action)
            filters.action = action;
        if (entityType)
            filters.entityType = entityType;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (limit)
            filters.limit = parseInt(limit);
        const logs = await this.auditService.getAuditLogs(user.organizationId, filters);
        return {
            success: true,
            data: logs,
            count: logs.length,
        };
    }
    async getSecurityEvents(user, userId, eventType, severity, resolved, startDate, endDate, limit) {
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (eventType)
            filters.eventType = eventType;
        if (severity)
            filters.severity = severity;
        if (resolved !== undefined)
            filters.resolved = resolved === 'true';
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (limit)
            filters.limit = parseInt(limit);
        const events = await this.auditService.getSecurityEvents(user.organizationId, filters);
        return {
            success: true,
            data: events,
            count: events.length,
        };
    }
    async getUnresolvedEvents(user) {
        const events = await this.auditService.getSecurityEvents(user.organizationId, {
            resolved: false,
        });
        return {
            success: true,
            data: events,
            count: events.length,
        };
    }
    async resolveSecurityEvent(eventId, user) {
        await this.auditService.resolveSecurityEvent(eventId, user.id);
    }
    async logSecurityEvent(user, eventData) {
        const event = {
            organizationId: user.organizationId,
            userId: eventData.userId || user.id,
            eventType: eventData.eventType,
            severity: eventData.severity,
            description: eventData.description,
            metadata: eventData.metadata,
        };
        await this.auditService.logSecurityEvent(event);
        return {
            success: true,
            message: 'Security event logged successfully',
        };
    }
    async getSecurityStatistics(user, days) {
        const period = days ? parseInt(days) : 30;
        const stats = await this.auditService.getSecurityStatistics(user.organizationId, period);
        return {
            success: true,
            data: stats,
        };
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('entity_type')),
    __param(4, (0, common_1.Query)('start_date')),
    __param(5, (0, common_1.Query)('end_date')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('security-events'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get security events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Security events retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('event_type')),
    __param(3, (0, common_1.Query)('severity')),
    __param(4, (0, common_1.Query)('resolved')),
    __param(5, (0, common_1.Query)('start_date')),
    __param(6, (0, common_1.Query)('end_date')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityEvents", null);
__decorate([
    (0, common_1.Get)('security-events/unresolved'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get unresolved security events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unresolved security events retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getUnresolvedEvents", null);
__decorate([
    (0, common_1.Patch)('security-events/:id/resolve'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a security event' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Security event resolved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "resolveSecurityEvent", null);
__decorate([
    (0, common_1.Post)('security-events'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Log a security event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Security event logged successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "logSecurityEvent", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get security statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Security statistics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityStatistics", null);
exports.SecurityController = SecurityController = __decorate([
    (0, swagger_1.ApiTags)('Security'),
    (0, common_1.Controller)('security'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], SecurityController);
//# sourceMappingURL=security.controller.js.map