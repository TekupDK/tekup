import { PrismaService } from '../database/prisma.service';
export interface AuditLogEntry {
    id?: string;
    organizationId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export interface SecurityEvent {
    id?: string;
    organizationId: string;
    userId?: string;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    resolved?: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logAction(entry: AuditLogEntry): Promise<void>;
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    getAuditLogs(organizationId: string, filters?: {
        userId?: string;
        action?: string;
        entityType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
    getSecurityEvents(organizationId: string, filters?: {
        userId?: string;
        eventType?: string;
        severity?: string;
        resolved?: boolean;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
    resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void>;
    getSecurityStatistics(organizationId: string, days?: number): Promise<any>;
    private getLogLevel;
}
