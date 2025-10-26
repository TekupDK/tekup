import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/services/prisma.service';
import type { Customer, Deal, Activity } from './crm.controller';

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface DealFilters {
  page?: number;
  limit?: number;
  stage?: string;
  customerId?: string;
}

interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  customerId?: string;
  dealId?: string;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Customer methods
  async listCustomers(
    tenantId: string,
    filters: CustomerFilters = {},
  ): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    try {
      const { page = 1, limit = 50, search, status } = filters;
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
      if (status) {
        where.status = status;
      }

      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return {
        customers: customers.map(this.mapPrismaCustomerToCustomer),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to list customers for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getCustomer(id: string, tenantId: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id, tenantId },
        include: {
          deals: true,
          activities: true,
        },
      });

      if (!customer) {
        return null;
      }

      return this.mapPrismaCustomerToCustomer(customer);
    } catch (error) {
      this.logger.error(`Failed to get customer ${id}:`, error);
      throw error;
    }
  }

  async createCustomer(
    customerData: Partial<Customer>,
    tenantId: string,
  ): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.create({
        data: {
          name: customerData.name || 'Unnamed Customer',
          email: customerData.email,
          phone: customerData.phone,
          company: customerData.company,
          address: customerData.address ? JSON.stringify(customerData.address) : null,
          tags: JSON.stringify(customerData.tags || []),
          customData: JSON.stringify(customerData.customData || {}),
          status: customerData.status || 'active',
          tenantId,
        },
      });

      return this.mapPrismaCustomerToCustomer(customer);
    } catch (error) {
      this.logger.error(`Failed to create customer:`, error);
      throw error;
    }
  }

  async updateCustomer(
    id: string,
    customerData: Partial<Customer>,
    tenantId: string,
  ): Promise<Customer> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id, tenantId },
        data: {
          ...(customerData.name && { name: customerData.name }),
          ...(customerData.email && { email: customerData.email }),
          ...(customerData.phone && { phone: customerData.phone }),
          ...(customerData.company && { company: customerData.company }),
          ...(customerData.address && { address: JSON.stringify(customerData.address) }),
          ...(customerData.tags && { tags: JSON.stringify(customerData.tags) }),
          ...(customerData.customData && { customData: JSON.stringify(customerData.customData) }),
          ...(customerData.status && { status: customerData.status }),
        },
      });

      return this.mapPrismaCustomerToCustomer(customer);
    } catch (error) {
      this.logger.error(`Failed to update customer ${id}:`, error);
      throw error;
    }
  }

  async deleteCustomer(id: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.customer.delete({
        where: { id, tenantId },
      });
      this.logger.log(`Deleted customer ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete customer ${id}:`, error);
      throw error;
    }
  }

  async getCustomerActivities(customerId: string, tenantId: string): Promise<Activity[]> {
    try {
      const activities = await this.prisma.activity.findMany({
        where: { customerId, customer: { tenantId } },
        include: { customer: true, deal: true },
        orderBy: { createdAt: 'desc' },
      });

      return activities.map(this.mapPrismaActivityToActivity);
    } catch (error) {
      this.logger.error(`Failed to get customer activities ${customerId}:`, error);
      throw error;
    }
  }

  async getCustomerDeals(customerId: string, tenantId: string): Promise<Deal[]> {
    try {
      const deals = await this.prisma.deal.findMany({
        where: { customerId, customer: { tenantId } },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
      });

      return deals.map(this.mapPrismaDealToDeal);
    } catch (error) {
      this.logger.error(`Failed to get customer deals ${customerId}:`, error);
      throw error;
    }
  }

  // Deal methods
  async listDeals(
    tenantId: string,
    filters: DealFilters = {},
  ): Promise<{ deals: Deal[]; total: number; page: number; limit: number }> {
    try {
      const { page = 1, limit = 50, stage, customerId } = filters;
      const skip = (page - 1) * limit;

      const where: any = {
        customer: { tenantId },
      };
      if (stage) {
        where.stage = stage;
      }
      if (customerId) {
        where.customerId = customerId;
      }

      const [deals, total] = await Promise.all([
        this.prisma.deal.findMany({
          where,
          skip,
          take: limit,
          include: { customer: true },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.deal.count({ where }),
      ]);

      return {
        deals: deals.map(this.mapPrismaDealToDeal),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to list deals for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getDeal(id: string, tenantId: string): Promise<Deal | null> {
    try {
      const deal = await this.prisma.deal.findFirst({
        where: { id, customer: { tenantId } },
        include: { customer: true, activities: true },
      });

      if (!deal) {
        return null;
      }

      return this.mapPrismaDealToDeal(deal);
    } catch (error) {
      this.logger.error(`Failed to get deal ${id}:`, error);
      throw error;
    }
  }

  async createDeal(dealData: Partial<Deal>, tenantId: string): Promise<Deal> {
    try {
      // Verify customer exists and belongs to tenant
      const customer = await this.prisma.customer.findFirst({
        where: { id: dealData.customerId, tenantId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer ${dealData.customerId} not found`);
      }

      const deal = await this.prisma.deal.create({
        data: {
          title: dealData.title || 'Untitled Deal',
          value: dealData.value,
          currency: dealData.currency || 'DKK',
          stage: dealData.stage || 'prospect',
          probability: dealData.probability,
          expectedCloseDate: dealData.expectedCloseDate,
          actualCloseDate: dealData.actualCloseDate,
          description: dealData.description,
          customData: JSON.stringify(dealData.customData || {}),
          customerId: dealData.customerId!,
        },
        include: { customer: true },
      });

      return this.mapPrismaDealToDeal(deal);
    } catch (error) {
      this.logger.error(`Failed to create deal:`, error);
      throw error;
    }
  }

  async updateDeal(id: string, dealData: Partial<Deal>, tenantId: string): Promise<Deal> {
    try {
      const deal = await this.prisma.deal.update({
        where: { id },
        data: {
          ...(dealData.title && { title: dealData.title }),
          ...(dealData.value !== undefined && { value: dealData.value }),
          ...(dealData.currency && { currency: dealData.currency }),
          ...(dealData.stage && { stage: dealData.stage }),
          ...(dealData.probability !== undefined && { probability: dealData.probability }),
          ...(dealData.expectedCloseDate && { expectedCloseDate: dealData.expectedCloseDate }),
          ...(dealData.actualCloseDate && { actualCloseDate: dealData.actualCloseDate }),
          ...(dealData.description && { description: dealData.description }),
          ...(dealData.customData && { customData: JSON.stringify(dealData.customData) }),
        },
        include: { customer: true },
      });

      return this.mapPrismaDealToDeal(deal);
    } catch (error) {
      this.logger.error(`Failed to update deal ${id}:`, error);
      throw error;
    }
  }

  async deleteDeal(id: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.deal.delete({
        where: { id },
      });
      this.logger.log(`Deleted deal ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete deal ${id}:`, error);
      throw error;
    }
  }

  async moveDealToStage(id: string, stage: string, tenantId: string): Promise<Deal> {
    try {
      const deal = await this.prisma.deal.update({
        where: { id },
        data: { 
          stage,
          ...(stage === 'won' && { actualCloseDate: new Date() }),
        },
        include: { customer: true },
      });

      return this.mapPrismaDealToDeal(deal);
    } catch (error) {
      this.logger.error(`Failed to move deal ${id} to stage ${stage}:`, error);
      throw error;
    }
  }

  // Activity methods
  async listActivities(
    tenantId: string,
    filters: ActivityFilters = {},
  ): Promise<{ activities: Activity[]; total: number; page: number; limit: number }> {
    try {
      const { page = 1, limit = 50, type, status, customerId, dealId } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (customerId) {
        where.customerId = customerId;
      }
      if (dealId) {
        where.dealId = dealId;
      }
      if (type) {
        where.type = type;
      }
      if (status) {
        where.status = status;
      }

      // Ensure tenant filtering through customer or deal relation
      if (customerId) {
        where.customer = { tenantId };
      } else if (dealId) {
        where.deal = { customer: { tenantId } };
      } else {
        // If no specific customer or deal, filter by customer tenant
        where.OR = [
          { customer: { tenantId } },
          { deal: { customer: { tenantId } } },
        ];
      }

      const [activities, total] = await Promise.all([
        this.prisma.activity.findMany({
          where,
          skip,
          take: limit,
          include: { customer: true, deal: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.activity.count({ where }),
      ]);

      return {
        activities: activities.map(this.mapPrismaActivityToActivity),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to list activities for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getActivity(id: string, tenantId: string): Promise<Activity | null> {
    try {
      const activity = await this.prisma.activity.findFirst({
        where: {
          id,
          OR: [
            { customer: { tenantId } },
            { deal: { customer: { tenantId } } },
          ],
        },
        include: { customer: true, deal: true },
      });

      if (!activity) {
        return null;
      }

      return this.mapPrismaActivityToActivity(activity);
    } catch (error) {
      this.logger.error(`Failed to get activity ${id}:`, error);
      throw error;
    }
  }

  async createActivity(
    activityData: Partial<Activity>,
    tenantId: string,
  ): Promise<Activity> {
    try {
      const activity = await this.prisma.activity.create({
        data: {
          type: activityData.type || 'note',
          title: activityData.title || 'Untitled Activity',
          description: activityData.description,
          status: activityData.status || 'pending',
          scheduledAt: activityData.scheduledAt,
          completedAt: activityData.completedAt,
          customerId: activityData.customerId,
          dealId: activityData.dealId,
        },
        include: { customer: true, deal: true },
      });

      return this.mapPrismaActivityToActivity(activity);
    } catch (error) {
      this.logger.error(`Failed to create activity:`, error);
      throw error;
    }
  }

  async updateActivity(
    id: string,
    activityData: Partial<Activity>,
    tenantId: string,
  ): Promise<Activity> {
    try {
      const activity = await this.prisma.activity.update({
        where: { id },
        data: {
          ...(activityData.type && { type: activityData.type }),
          ...(activityData.title && { title: activityData.title }),
          ...(activityData.description && { description: activityData.description }),
          ...(activityData.status && { status: activityData.status }),
          ...(activityData.scheduledAt && { scheduledAt: activityData.scheduledAt }),
          ...(activityData.completedAt && { completedAt: activityData.completedAt }),
        },
        include: { customer: true, deal: true },
      });

      return this.mapPrismaActivityToActivity(activity);
    } catch (error) {
      this.logger.error(`Failed to update activity ${id}:`, error);
      throw error;
    }
  }

  async deleteActivity(id: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.activity.delete({
        where: { id },
      });
      this.logger.log(`Deleted activity ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete activity ${id}:`, error);
      throw error;
    }
  }

  async completeActivity(id: string, tenantId: string): Promise<Activity> {
    try {
      const activity = await this.prisma.activity.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
        include: { customer: true, deal: true },
      });

      return this.mapPrismaActivityToActivity(activity);
    } catch (error) {
      this.logger.error(`Failed to complete activity ${id}:`, error);
      throw error;
    }
  }

  // Analytics methods
  async getPipelineAnalytics(tenantId: string): Promise<{
    stages: Array<{ stage: string; count: number; value: number }>;
    totalValue: number;
    totalDeals: number;
  }> {
    try {
      const deals = await this.prisma.deal.findMany({
        where: { customer: { tenantId } },
      });

      const stages = deals.reduce((acc, deal) => {
        const stage = deal.stage;
        if (!acc[stage]) {
          acc[stage] = { stage, count: 0, value: 0 };
        }
        acc[stage].count++;
        acc[stage].value += deal.value || 0;
        return acc;
      }, {} as Record<string, { stage: string; count: number; value: number }>);

      const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

      return {
        stages: Object.values(stages),
        totalValue,
        totalDeals: deals.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get pipeline analytics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getRevenueAnalytics(
    tenantId: string,
    timeWindow: number = 30,
  ): Promise<{
    currentRevenue: number;
    previousRevenue: number;
    growth: number;
    dailyRevenue: Array<{ date: string; revenue: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeWindow * 24 * 60 * 60 * 1000);
      const previousStartDate = new Date(startDate.getTime() - timeWindow * 24 * 60 * 60 * 1000);

      const [currentDeals, previousDeals] = await Promise.all([
        this.prisma.deal.findMany({
          where: {
            customer: { tenantId },
            stage: 'won',
            actualCloseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.deal.findMany({
          where: {
            customer: { tenantId },
            stage: 'won',
            actualCloseDate: {
              gte: previousStartDate,
              lt: startDate,
            },
          },
        }),
      ]);

      const currentRevenue = currentDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const previousRevenue = previousDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Generate daily revenue data (simplified)
      const dailyRevenue = [];
      for (let i = 0; i < timeWindow; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayDeals = currentDeals.filter(
          deal => deal.actualCloseDate &&
          new Date(deal.actualCloseDate).toDateString() === date.toDateString()
        );
        const revenue = dayDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        dailyRevenue.push({
          date: date.toISOString().split('T')[0],
          revenue,
        });
      }

      return {
        currentRevenue,
        previousRevenue,
        growth,
        dailyRevenue,
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue analytics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getActivityAnalytics(tenantId: string): Promise<{
    totalActivities: number;
    completedActivities: number;
    pendingActivities: number;
    completionRate: number;
    activityTypes: Array<{ type: string; count: number }>;
  }> {
    try {
      const activities = await this.prisma.activity.findMany({
        where: {
          OR: [
            { customer: { tenantId } },
            { deal: { customer: { tenantId } } },
          ],
        },
      });

      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const pendingActivities = activities.filter(a => a.status === 'pending').length;
      const completionRate = activities.length > 0 ? (completedActivities / activities.length) * 100 : 0;

      const activityTypes = activities.reduce((acc, activity) => {
        const type = activity.type;
        if (!acc[type]) {
          acc[type] = { type, count: 0 };
        }
        acc[type].count++;
        return acc;
      }, {} as Record<string, { type: string; count: number }>);

      return {
        totalActivities: activities.length,
        completedActivities,
        pendingActivities,
        completionRate,
        activityTypes: Object.values(activityTypes),
      };
    } catch (error) {
      this.logger.error(`Failed to get activity analytics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // Helper mapping methods
  private mapPrismaCustomerToCustomer(prismaCustomer: any): Customer {
    return {
      id: prismaCustomer.id,
      name: prismaCustomer.name,
      email: prismaCustomer.email,
      phone: prismaCustomer.phone,
      company: prismaCustomer.company,
      address: prismaCustomer.address ? JSON.parse(prismaCustomer.address) : undefined,
      tags: JSON.parse(prismaCustomer.tags || '[]'),
      customData: JSON.parse(prismaCustomer.customData || '{}'),
      status: prismaCustomer.status as 'active' | 'inactive' | 'blocked',
      tenantId: prismaCustomer.tenantId,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    };
  }

  private mapPrismaDealToDeal(prismaDeal: any): Deal {
    return {
      id: prismaDeal.id,
      title: prismaDeal.title,
      value: prismaDeal.value,
      currency: prismaDeal.currency,
      stage: prismaDeal.stage,
      probability: prismaDeal.probability,
      expectedCloseDate: prismaDeal.expectedCloseDate,
      actualCloseDate: prismaDeal.actualCloseDate,
      description: prismaDeal.description,
      customData: JSON.parse(prismaDeal.customData || '{}'),
      customerId: prismaDeal.customerId,
      customer: prismaDeal.customer ? this.mapPrismaCustomerToCustomer(prismaDeal.customer) : undefined,
      createdAt: prismaDeal.createdAt,
      updatedAt: prismaDeal.updatedAt,
    };
  }

  private mapPrismaActivityToActivity(prismaActivity: any): Activity {
    return {
      id: prismaActivity.id,
      type: prismaActivity.type,
      title: prismaActivity.title,
      description: prismaActivity.description,
      status: prismaActivity.status as 'pending' | 'completed' | 'cancelled',
      scheduledAt: prismaActivity.scheduledAt,
      completedAt: prismaActivity.completedAt,
      customerId: prismaActivity.customerId,
      dealId: prismaActivity.dealId,
      customer: prismaActivity.customer ? this.mapPrismaCustomerToCustomer(prismaActivity.customer) : undefined,
      deal: prismaActivity.deal ? this.mapPrismaDealToDeal(prismaActivity.deal) : undefined,
      createdAt: prismaActivity.createdAt,
      updatedAt: prismaActivity.updatedAt,
    };
  }
}
