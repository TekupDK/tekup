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
const supabase_service_1 = require("../supabase/supabase.service");
let AuditService = AuditService_1 = class AuditService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async logAction(entry) {
        try {
            const { error } = await this.supabaseService.client
                .from('audit_logs')
                .insert({
                ...entry,
                created_at: new Date().toISOString(),
            });
            if (error) {
                this.logger.error('Failed to create audit log entry', error);
            }
        }
        catch (error) {
            this.logger.error('Error creating audit log entry', error);
        }
    }
    async logSecurityEvent(event) {
        try {
            await this.logAction({
                organization_id: event.organization_id,
                user_id: event.user_id,
                action: 'security_event',
                entity_type: 'security',
                entity_id: event.event_type,
                new_values: {
                    event_type: event.event_type,
                    severity: event.severity,
                    description: event.description,
                    metadata: event.metadata,
                },
                ip_address: event.ip_address,
                user_agent: event.user_agent,
            });
            const logLevel = this.getLogLevel(event.severity);
            this.logger[logLevel](`Security Event: ${event.event_type} - ${event.description}`, {
                organizationId: event.organization_id,
                userId: event.user_id,
                severity: event.severity,
                metadata: event.metadata,
            });
        }
        catch (error) {
            this.logger.error('Error logging security event', error);
        }
    }
    async getAuditLogs(organizationId, filters = {}) {
        try {
            let query = this.supabaseService.client
                .from('audit_logs')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters.action) {
                query = query.eq('action', filters.action);
            }
            if (filters.entityType) {
                query = query.eq('entity_type', filters.entityType);
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to get audit logs: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Error getting audit logs', error);
            throw error;
        }
    }
    async getSecurityEvents(organizationId, filters = {}) {
        try {
            let query = this.supabaseService.client
                .from('audit_logs')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('action', 'security_event')
                .order('created_at', { ascending: false });
            if (filters.severity) {
                query = query.eq('new_values->severity', filters.severity);
            }
            if (filters.eventType) {
                query = query.eq('entity_id', filters.eventType);
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to get security events: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Error getting security events', error);
            throw error;
        }
    }
    async generateAuditReport(organizationId, dateFrom, dateTo) {
        try {
            const auditLogs = await this.getAuditLogs(organizationId, {
                dateFrom,
                dateTo,
                limit: 10000,
            });
            const securityEvents = auditLogs.filter(log => log.action === 'security_event');
            const totalActions = auditLogs.length;
            const uniqueUsers = new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size;
            const actionCounts = auditLogs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {});
            const topActions = Object.entries(actionCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([action, count]) => ({ action, count }));
            const userActivity = auditLogs.reduce((acc, log) => {
                if (log.user_id) {
                    acc[log.user_id] = (acc[log.user_id] || 0) + 1;
                }
                return acc;
            }, {});
            const userActivityArray = Object.entries(userActivity)
                .sort(([, a], [, b]) => b - a)
                .map(([userId, actionCount]) => ({ userId, actionCount }));
            const entityChanges = auditLogs.reduce((acc, log) => {
                acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
                return acc;
            }, {});
            const entityChangesArray = Object.entries(entityChanges)
                .sort(([, a], [, b]) => b - a)
                .map(([entityType, changeCount]) => ({ entityType, changeCount }));
            const securityEventsByType = securityEvents.reduce((acc, event) => {
                const eventType = event.entity_id || 'unknown';
                const severity = event.new_values?.severity || 'unknown';
                const key = `${eventType}:${severity}`;
                if (!acc[key]) {
                    acc[key] = { eventType, count: 0, severity };
                }
                acc[key].count++;
                return acc;
            }, {});
            const securityEventsByTypeArray = Object.values(securityEventsByType)
                .sort((a, b) => b.count - a.count);
            return {
                summary: {
                    totalActions,
                    uniqueUsers,
                    topActions,
                    securityEvents: securityEvents.length,
                },
                details: {
                    userActivity: userActivityArray,
                    entityChanges: entityChangesArray,
                    securityEventsByType: securityEventsByTypeArray,
                },
            };
        }
        catch (error) {
            this.logger.error('Error generating audit report', error);
            throw error;
        }
    }
    async logUserLogin(organizationId, userId, ipAddress, userAgent) {
        await this.logAction({
            organization_id: organizationId,
            user_id: userId,
            action: 'user_login',
            entity_type: 'user',
            entity_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    }
    async logUserLogout(organizationId, userId, ipAddress) {
        await this.logAction({
            organization_id: organizationId,
            user_id: userId,
            action: 'user_logout',
            entity_type: 'user',
            entity_id: userId,
            ip_address: ipAddress,
        });
    }
    async logFailedLogin(organizationId, email, ipAddress, userAgent) {
        await this.logSecurityEvent({
            organization_id: organizationId,
            event_type: 'failed_login',
            severity: 'medium',
            description: `Failed login attempt for email: ${email}`,
            metadata: { email },
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    }
    async logDataAccess(organizationId, userId, entityType, entityId, action, oldValues, newValues) {
        await this.logAction({
            organization_id: organizationId,
            user_id: userId,
            action: `${entityType}_${action}`,
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues,
            new_values: newValues,
        });
    }
    async logPermissionChange(organizationId, adminUserId, targetUserId, oldRole, newRole) {
        await this.logAction({
            organization_id: organizationId,
            user_id: adminUserId,
            action: 'permission_change',
            entity_type: 'user',
            entity_id: targetUserId,
            old_values: { role: oldRole },
            new_values: { role: newRole },
        });
        await this.logSecurityEvent({
            organization_id: organizationId,
            user_id: adminUserId,
            event_type: 'permission_change',
            severity: 'high',
            description: `User role changed from ${oldRole} to ${newRole}`,
            metadata: { targetUserId, oldRole, newRole },
        });
    }
    async logSuspiciousActivity(organizationId, userId, activityType, description, metadata, ipAddress) {
        await this.logSecurityEvent({
            organization_id: organizationId,
            user_id: userId,
            event_type: 'suspicious_activity',
            severity: 'high',
            description: `${activityType}: ${description}`,
            metadata: { activityType, ...metadata },
            ip_address: ipAddress,
        });
    }
    async logDataExport(organizationId, userId, dataType, recordCount) {
        await this.logAction({
            organization_id: organizationId,
            user_id: userId,
            action: 'data_export',
            entity_type: 'data',
            entity_id: dataType,
            new_values: { recordCount, exportedAt: new Date().toISOString() },
        });
        await this.logSecurityEvent({
            organization_id: organizationId,
            user_id: userId,
            event_type: 'data_export',
            severity: 'medium',
            description: `Data export: ${recordCount} ${dataType} records`,
            metadata: { dataType, recordCount },
        });
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
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditService);
//# sourceMappingURL=audit.service.js.map