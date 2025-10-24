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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async logAction(entry) {
        try {
            await this.prisma.renosAuditLog.create({
                data: {
                    organizationId: entry.organizationId,
                    userId: entry.userId,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    oldValues: entry.oldValues || null,
                    newValues: entry.newValues || null,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to create audit log entry', error);
        }
    }
    async logSecurityEvent(event) {
        try {
            await this.prisma.renosSecurityEvent.create({
                data: {
                    organizationId: event.organizationId,
                    userId: event.userId,
                    eventType: event.eventType,
                    severity: event.severity,
                    description: event.description,
                    metadata: event.metadata || null,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                    resolved: event.resolved || false,
                    resolvedAt: event.resolvedAt || null,
                    resolvedBy: event.resolvedBy,
                },
            });
            await this.logAction({
                organizationId: event.organizationId,
                userId: event.userId,
                action: 'security_event',
                entityType: 'security',
                entityId: event.eventType,
                newValues: {
                    eventType: event.eventType,
                    severity: event.severity,
                    description: event.description,
                    metadata: event.metadata,
                },
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
            });
            const logLevel = this.getLogLevel(event.severity);
            this.logger[logLevel](`Security Event: ${event.eventType} - ${event.description}`, {
                organizationId: event.organizationId,
                userId: event.userId,
                severity: event.severity,
                metadata: event.metadata,
            });
        }
        catch (error) {
            this.logger.error('Failed to log security event', error);
        }
    }
    async getAuditLogs(organizationId, filters) {
        try {
            const where = { organizationId };
            if (filters?.userId)
                where.userId = filters.userId;
            if (filters?.action)
                where.action = filters.action;
            if (filters?.entityType)
                where.entityType = filters.entityType;
            if (filters?.startDate || filters?.endDate) {
                where.createdAt = {};
                if (filters.startDate)
                    where.createdAt.gte = filters.startDate;
                if (filters.endDate)
                    where.createdAt.lte = filters.endDate;
            }
            const logs = await this.prisma.renosAuditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 100,
            });
            return logs;
        }
        catch (error) {
            this.logger.error('Failed to get audit logs', error);
            return [];
        }
    }
    async getSecurityEvents(organizationId, filters) {
        try {
            const where = { organizationId };
            if (filters?.userId)
                where.userId = filters.userId;
            if (filters?.eventType)
                where.eventType = filters.eventType;
            if (filters?.severity)
                where.severity = filters.severity;
            if (filters?.resolved !== undefined)
                where.resolved = filters.resolved;
            if (filters?.startDate || filters?.endDate) {
                where.createdAt = {};
                if (filters.startDate)
                    where.createdAt.gte = filters.startDate;
                if (filters.endDate)
                    where.createdAt.lte = filters.endDate;
            }
            const events = await this.prisma.renosSecurityEvent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 100,
            });
            return events;
        }
        catch (error) {
            this.logger.error('Failed to get security events', error);
            return [];
        }
    }
    async resolveSecurityEvent(eventId, resolvedBy) {
        try {
            await this.prisma.renosSecurityEvent.update({
                where: { id: eventId },
                data: {
                    resolved: true,
                    resolvedAt: new Date(),
                    resolvedBy,
                },
            });
            this.logger.log(`Security event ${eventId} resolved by ${resolvedBy}`);
        }
        catch (error) {
            this.logger.error('Failed to resolve security event', error);
        }
    }
    async getSecurityStatistics(organizationId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const [totalEvents, unresolvedEvents, eventsBySeverity] = await Promise.all([
                this.prisma.renosSecurityEvent.count({
                    where: {
                        organizationId,
                        createdAt: { gte: startDate },
                    },
                }),
                this.prisma.renosSecurityEvent.count({
                    where: {
                        organizationId,
                        resolved: false,
                    },
                }),
                this.prisma.renosSecurityEvent.groupBy({
                    by: ['severity'],
                    where: {
                        organizationId,
                        createdAt: { gte: startDate },
                    },
                    _count: true,
                }),
            ]);
            const severityCounts = eventsBySeverity.reduce((acc, item) => {
                acc[item.severity] = item._count;
                return acc;
            }, {});
            return {
                totalEvents,
                unresolvedEvents,
                eventsBySeverity: severityCounts,
                period: `${days} days`,
            };
        }
        catch (error) {
            this.logger.error('Failed to get security statistics', error);
            return null;
        }
    }
    getLogLevel(severity) {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            default:
                return 'log';
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map