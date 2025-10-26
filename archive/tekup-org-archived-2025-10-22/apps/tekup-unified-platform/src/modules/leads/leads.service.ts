import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/services/prisma.service';
import type { Lead, LeadQualification } from './leads.controller';

interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // List leads with filters and pagination
  async listLeads(
    tenantId: string,
    filters: LeadFilters = {},
  ): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50, search, status, source } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads: leads.map(this.mapPrismaLeadToLead),
      total,
      page,
      limit,
    };
  }

  // Get single lead by id (tenant-scoped)
  async getLead(id: string, tenantId: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) return null;
    return this.mapPrismaLeadToLead(lead);
  }

  // Create new lead
  async createLead(leadData: Partial<Lead>, tenantId: string): Promise<Lead> {
    // Validate required fields
    if (!leadData.name?.trim()) {
      throw new BadRequestException('Lead name is required');
    }
    
    if (!tenantId?.trim()) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Validate email format if provided
    if (leadData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate phone format if provided (simple validation)
    if (leadData.phone && !/^[+]?[0-9\s\-()]{7,}$/.test(leadData.phone)) {
      throw new BadRequestException('Invalid phone format');
    }

    try {
      const lead = await this.prisma.lead.create({
        data: {
          name: leadData.name.trim(),
          email: leadData.email?.toLowerCase().trim() || null,
          phone: leadData.phone?.trim() || null,
          company: leadData.company?.trim() || null,
          source: leadData.source?.trim() || 'unknown',
          status: (leadData.status as string) || 'new',
          score: leadData.score ?? null,
          qualifiedAt: leadData.qualifiedAt ?? null,
          convertedAt: leadData.convertedAt ?? null,
          conversionType: leadData.conversionType ?? null,
          notes: leadData.notes?.trim() || null,
          customData: JSON.stringify(leadData.customData || {}),
          tenantId,
        },
      });

      this.logger.log(`Created lead ${lead.id} for tenant ${tenantId}`);
      return this.mapPrismaLeadToLead(lead);
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid tenant ID: ${tenantId}`);
      }
      this.logger.error(`Failed to create lead for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  // Update lead
  async updateLead(id: string, leadData: Partial<Lead>, tenantId: string): Promise<Lead> {
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(leadData.name && { name: leadData.name }),
        ...(leadData.email && { email: leadData.email }),
        ...(leadData.phone && { phone: leadData.phone }),
        ...(leadData.company && { company: leadData.company }),
        ...(leadData.source && { source: leadData.source }),
        ...(leadData.status && { status: leadData.status as string }),
        ...(typeof leadData.score === 'number' && { score: leadData.score }),
        ...(leadData.qualifiedAt && { qualifiedAt: leadData.qualifiedAt }),
        ...(leadData.convertedAt && { convertedAt: leadData.convertedAt }),
        ...(leadData.conversionType && { conversionType: leadData.conversionType }),
        ...(leadData.notes && { notes: leadData.notes }),
        ...(leadData.customData && { customData: JSON.stringify(leadData.customData) }),
      },
    });

    // Ensure tenant match after update (SQLite lacks multi-column where on update)
    if (updated.tenantId !== tenantId) {
      throw new NotFoundException('Lead not found');
    }
    return this.mapPrismaLeadToLead(updated);
  }

  // Delete lead
  async deleteLead(id: string, tenantId: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.tenantId !== tenantId) {
      throw new NotFoundException('Lead not found');
    }
    await this.prisma.lead.delete({ where: { id } });
  }

  // Qualify lead and store qualification record
  async qualifyLead(
    id: string,
    qualificationData: { criteria: string; result: string; score?: number; notes?: string },
    tenantId: string,
  ): Promise<LeadQualification> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const [qualification] = await this.prisma.$transaction([
      this.prisma.leadQualification.create({
        data: {
          leadId: id,
          criteria: qualificationData.criteria,
          result: qualificationData.result,
          score: qualificationData.score ?? null,
          notes: qualificationData.notes,
        },
      }),
      this.prisma.lead.update({
        where: { id },
        data: {
          status: 'qualified',
          qualifiedAt: new Date(),
          ...(typeof qualificationData.score === 'number' && { score: qualificationData.score }),
        },
      }),
    ]);

    return {
      id: qualification.id,
      criteria: qualification.criteria,
      result: qualification.result,
      score: qualification.score ?? undefined,
      notes: qualification.notes ?? undefined,
      leadId: qualification.leadId,
      createdAt: qualification.createdAt,
    };
  }

  async getLeadQualifications(id: string, tenantId: string): Promise<LeadQualification[]> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const records = await this.prisma.leadQualification.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } });
    return records.map((q) => ({
      id: q.id,
      criteria: q.criteria,
      result: q.result,
      score: q.score ?? undefined,
      notes: q.notes ?? undefined,
      leadId: q.leadId,
      createdAt: q.createdAt,
    }));
  }

  // Simple lead scoring example (can be made more advanced)
  async calculateLeadScore(id: string, tenantId: string): Promise<{ leadId: string; score: number; factors: Record<string, any> }> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const factors: Record<string, any> = {
      hasEmail: !!lead.email,
      hasPhone: !!lead.phone,
      hasCompany: !!lead.company,
      source: lead.source || 'unknown',
    };
    let score = 0;
    if (factors.hasEmail) score += 20;
    if (factors.hasPhone) score += 30;
    if (factors.hasCompany) score += 20;
    if ((lead.source || '').toLowerCase() === 'referral') score += 20;
    if ((lead.source || '').toLowerCase() === 'website') score += 10;
    score = Math.min(score, 100);

    await this.prisma.lead.update({ where: { id }, data: { score } });
    return { leadId: id, score, factors };
  }

  // Convert a lead to a customer (simple flow)
  async convertLead(
    id: string,
    conversionData: { conversionType: string; notes?: string },
    tenantId: string,
  ): Promise<{ lead: Lead; customerId?: string; message: string }> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // If already converted, just return
    if (lead.convertedAt) {
      return {
        lead: this.mapPrismaLeadToLead(lead),
        customerId: undefined,
        message: 'Lead already converted',
      };
    }

    // Create customer from lead minimal fields
    const customer = await this.prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        tags: '[]',
        customData: '{}',
        status: 'active',
        tenantId,
      },
    });

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        conversionType: conversionData.conversionType,
        notes: [lead.notes, conversionData.notes].filter(Boolean).join('\n'),
      },
    });

    return {
      lead: this.mapPrismaLeadToLead(updatedLead),
      customerId: customer.id,
      message: 'Lead converted to customer',
    };
  }

  // Assign lead to a user (for now we just store in customData)
  async assignLead(id: string, assignmentData: { assignedTo: string; notes?: string }, tenantId: string): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const custom = (() => {
      try { return JSON.parse(lead.customData || '{}'); } catch { return {}; }
    })();
    custom.assignedTo = assignmentData.assignedTo;
    if (assignmentData.notes) custom.assignmentNotes = assignmentData.notes;

    const updated = await this.prisma.lead.update({ where: { id }, data: { customData: JSON.stringify(custom) } });
    return this.mapPrismaLeadToLead(updated);
  }

  // Schedule follow-up by creating an activity tied to the converted customer if exists (or leave note)
  async scheduleFollowUp(
    id: string,
    followUpData: { scheduledAt: Date; type: string; notes?: string },
    tenantId: string,
  ): Promise<{ leadId: string; followUpId: string; scheduledAt: Date }> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // If lead already converted, attach follow-up to the customer as an activity
    const customer = await this.prisma.customer.findFirst({ where: { email: lead.email || '', tenantId } });
    if (customer) {
      const activity = await this.prisma.activity.create({
        data: {
          type: followUpData.type,
          title: `Follow-up for lead ${lead.name}`,
          description: followUpData.notes,
          status: 'pending',
          scheduledAt: followUpData.scheduledAt,
          customerId: customer.id,
        },
      });
      return { leadId: id, followUpId: activity.id, scheduledAt: activity.scheduledAt! };
    }

    // Otherwise, store follow-up info in customData
    const custom = (() => {
      try { return JSON.parse(lead.customData || '{}'); } catch { return {}; }
    })();
    custom.followUps = custom.followUps || [];
    custom.followUps.push({
      type: followUpData.type,
      notes: followUpData.notes,
      scheduledAt: followUpData.scheduledAt,
      createdAt: new Date(),
    });
    const updated = await this.prisma.lead.update({ where: { id }, data: { customData: JSON.stringify(custom) } });
    return { leadId: id, followUpId: `custom:${updated.id}:${custom.followUps.length}`, scheduledAt: followUpData.scheduledAt };
  }

  // Analytics
  async getConversionAnalytics(tenantId: string, period: string) {
    // Simple 30d window for now
    const since = this.periodToDate(period);
    const [totalLeads, convertedLeads, bySource] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: since } } }),
      this.prisma.lead.count({ where: { tenantId, convertedAt: { not: null }, createdAt: { gte: since } } }),
      this.prisma.lead.groupBy({ by: ['source'], where: { tenantId, createdAt: { gte: since } }, _count: { _all: true } }).catch(() => [] as any[]),
    ]);
    const conversionRate = totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 10000) / 100;

    // Fake trend (can be replaced with SQL later)
    const conversionTrend = [{ date: since.toISOString().slice(0, 10), conversions: convertedLeads }];

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      conversionsBySource: Object.fromEntries(bySource.filter(b => b.source).map((b: any) => [b.source, b._count._all])),
      conversionTrend,
    };
  }

  async getSourceAnalytics(tenantId: string, period: string) {
    const since = this.periodToDate(period);
    const sources = await this.prisma.lead.findMany({ where: { tenantId, createdAt: { gte: since } }, select: { source: true, status: true, score: true } });
    const map = new Map<string, { total: number; qualified: number; converted: number; scoreSum: number; scoreCount: number }>();
    for (const s of sources) {
      const key = (s.source || 'unknown').toLowerCase();
      const e = map.get(key) || { total: 0, qualified: 0, converted: 0, scoreSum: 0, scoreCount: 0 };
      e.total += 1;
      if ((s.status || '').toLowerCase() === 'qualified') e.qualified += 1;
      if ((s.status || '').toLowerCase() === 'converted') e.converted += 1;
      if (typeof s.score === 'number') { e.scoreSum += s.score; e.scoreCount += 1; }
      map.set(key, e);
    }
    const sourcePerformance = Array.from(map.entries()).map(([source, v]) => ({
      source,
      totalLeads: v.total,
      qualifiedLeads: v.qualified,
      convertedLeads: v.converted,
      averageScore: v.scoreCount ? Math.round((v.scoreSum / v.scoreCount) * 100) / 100 : 0,
    }));
    return { sourcePerformance };
  }

  async getPipelineAnalytics(tenantId: string) {
    const [counts, avgScore] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['status'], where: { tenantId }, _count: { _all: true } }).catch(() => [] as any[]),
      this.prisma.lead.aggregate({ where: { tenantId, score: { not: null } }, _avg: { score: true } }).catch(() => ({ _avg: { score: 0 } } as any)),
    ]);
    const pipeline = Object.fromEntries(counts.map((c: any) => [c.status, c._count._all]));
    return { pipeline, totalValue: 0, averageScore: Math.round((avgScore._avg.score || 0) * 100) / 100 };
  }

  // Mappers
  private mapPrismaLeadToLead = (l: any): Lead => ({
    id: l.id,
    name: l.name,
    email: l.email || undefined,
    phone: l.phone || undefined,
    company: l.company || undefined,
    source: l.source || undefined,
    status: (l.status as any) || 'new',
    score: l.score ?? undefined,
    qualifiedAt: l.qualifiedAt || undefined,
    convertedAt: l.convertedAt || undefined,
    conversionType: l.conversionType || undefined,
    notes: l.notes || undefined,
    customData: this.safeParseJSON(l.customData, {}),
    tenantId: l.tenantId,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  });

  private safeParseJSON(input: any, fallback: any) {
    try {
      return input ? JSON.parse(input) : fallback;
    } catch {
      return fallback;
    }
  }

  private periodToDate(period: string): Date {
    const now = new Date();
    const m = /^([0-9]+)([dhm])$/.exec(period || '30d');
    if (!m) { now.setDate(now.getDate() - 30); return now; }
    const n = parseInt(m[1], 10); const unit = m[2];
    if (unit === 'd') now.setDate(now.getDate() - n);
    if (unit === 'h') now.setHours(now.getHours() - n);
    if (unit === 'm') now.setMinutes(now.getMinutes() - n);
    return now;
  }
}
