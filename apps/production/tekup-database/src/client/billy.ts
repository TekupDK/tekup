/**
 * Billy Schema Client
 * Tekup-Billy MCP-specific database queries
 */

import { prisma } from './index';

export const billy = {
  // Organizations
  async findOrganization(billyOrgId: string) {
    return prisma.billyOrganization.findUnique({
      where: { billyOrgId },
      include: { users: true },
    });
  },

  async createOrganization(data: {
    name: string;
    billyApiKey: string;
    billyOrgId: string;
    settings?: any;
  }) {
    return prisma.billyOrganization.create({ data });
  },

  // Cache Operations
  async getCachedInvoice(organizationId: string, billyId: string) {
    const cached = await prisma.billyCachedInvoice.findUnique({
      where: {
        organizationId_billyId: { organizationId, billyId },
      },
    });

    // Check if expired
    if (cached && cached.expiresAt < new Date()) {
      await prisma.billyCachedInvoice.delete({
        where: { id: cached.id },
      });
      return null;
    }

    return cached;
  },

  async setCachedInvoice(
    organizationId: string,
    billyId: string,
    data: any,
    ttlMinutes = 60
  ) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    return prisma.billyCachedInvoice.upsert({
      where: {
        organizationId_billyId: { organizationId, billyId },
      },
      create: {
        organizationId,
        billyId,
        data,
        expiresAt,
      },
      update: {
        data,
        cachedAt: new Date(),
        expiresAt,
      },
    });
  },

  async clearExpiredCache() {
    const now = new Date();

    const [invoices, customers, products] = await Promise.all([
      prisma.billyCachedInvoice.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.billyCachedCustomer.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.billyCachedProduct.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);

    return {
      invoices: invoices.count,
      customers: customers.count,
      products: products.count,
    };
  },

  // Audit Logging
  async logAudit(data: {
    organizationId: string;
    userId?: string;
    toolName: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    inputParams?: any;
    outputData?: any;
    success: boolean;
    errorMessage?: string;
    durationMs?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.billyAuditLog.create({ data });
  },

  async getAuditLogs(
    organizationId: string,
    filters?: {
      userId?: string;
      toolName?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    return prisma.billyAuditLog.findMany({
      where: {
        organizationId,
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.toolName && { toolName: filters.toolName }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      take: filters?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
  },

  // Usage Metrics
  async trackUsage(
    organizationId: string,
    toolName: string,
    success: boolean,
    durationMs?: number
  ) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    return prisma.billyUsageMetric.upsert({
      where: {
        organizationId_date_hour_toolName: {
          organizationId,
          date,
          hour,
          toolName,
        },
      },
      create: {
        organizationId,
        date,
        hour,
        toolName,
        callCount: 1,
        successCount: success ? 1 : 0,
        errorCount: success ? 0 : 1,
        avgDurationMs: durationMs || 0,
      },
      update: {
        callCount: { increment: 1 },
        successCount: { increment: success ? 1 : 0 },
        errorCount: { increment: success ? 0 : 1 },
        avgDurationMs: durationMs
          ? { set: durationMs } // Simplified - should calculate average
          : undefined,
      },
    });
  },

  async getUsageMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.billyUsageMetric.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });
  },

  // Rate Limiting
  async checkRateLimit(
    organizationId: string,
    endpoint: string,
    windowMinutes = 15,
    maxRequests = 100
  ): Promise<{ allowed: boolean; remaining: number }> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const limit = await prisma.billyRateLimit.findUnique({
      where: {
        organizationId_endpoint_windowStart: {
          organizationId,
          endpoint,
          windowStart,
        },
      },
    });

    if (!limit) {
      await prisma.billyRateLimit.create({
        data: {
          organizationId,
          endpoint,
          windowStart,
          requestCount: 1,
        },
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (limit.requestCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await prisma.billyRateLimit.update({
      where: { id: limit.id },
      data: { requestCount: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: maxRequests - limit.requestCount - 1,
    };
  },
};

export default billy;
