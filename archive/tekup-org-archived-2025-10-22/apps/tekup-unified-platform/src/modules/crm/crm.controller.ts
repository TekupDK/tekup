import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { TenantId } from '../core/decorators/tenant-id.decorator';
import { AIService } from '../core/services/ai.service';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: any;
  tags: string[];
  customData: Record<string, any>;
  status: 'active' | 'inactive' | 'blocked';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  currency: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  description?: string;
  customData: Record<string, any>;
  customerId: string;
  customer?: Customer;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  completedAt?: Date;
  customerId?: string;
  dealId?: string;
  customer?: Customer;
  deal?: Deal;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('crm')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly aiService: AIService,
  ) {}

  // Customer endpoints
  @Get('customers')
  async listCustomers(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    return this.crmService.listCustomers(tenantId, { page, limit, search, status });
  }

  @Get('customers/:id')
  async getCustomer(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Customer | null> {
    return this.crmService.getCustomer(id, tenantId);
  }

  @Post('customers')
  async createCustomer(
    @Body() customerData: Partial<Customer>,
    @TenantId() tenantId: string,
  ): Promise<Customer> {
    return this.crmService.createCustomer(customerData, tenantId);
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() customerData: Partial<Customer>,
    @TenantId() tenantId: string,
  ): Promise<Customer> {
    return this.crmService.updateCustomer(id, customerData, tenantId);
  }

  @Delete('customers/:id')
  async deleteCustomer(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.crmService.deleteCustomer(id, tenantId);
    return { success: true };
  }

  @Get('customers/:id/activities')
  async getCustomerActivities(
    @Param('id') customerId: string,
    @TenantId() tenantId: string,
  ): Promise<Activity[]> {
    return this.crmService.getCustomerActivities(customerId, tenantId);
  }

  @Get('customers/:id/deals')
  async getCustomerDeals(
    @Param('id') customerId: string,
    @TenantId() tenantId: string,
  ): Promise<Deal[]> {
    return this.crmService.getCustomerDeals(customerId, tenantId);
  }

  // Deal endpoints
  @Get('deals')
  async listDeals(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('stage') stage?: string,
    @Query('customerId') customerId?: string,
  ): Promise<{ deals: Deal[]; total: number; page: number; limit: number }> {
    return this.crmService.listDeals(tenantId, { page, limit, stage, customerId });
  }

  @Get('deals/:id')
  async getDeal(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Deal | null> {
    return this.crmService.getDeal(id, tenantId);
  }

  @Post('deals')
  async createDeal(
    @Body() dealData: Partial<Deal>,
    @TenantId() tenantId: string,
  ): Promise<Deal> {
    return this.crmService.createDeal(dealData, tenantId);
  }

  @Put('deals/:id')
  async updateDeal(
    @Param('id') id: string,
    @Body() dealData: Partial<Deal>,
    @TenantId() tenantId: string,
  ): Promise<Deal> {
    return this.crmService.updateDeal(id, dealData, tenantId);
  }

  @Delete('deals/:id')
  async deleteDeal(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.crmService.deleteDeal(id, tenantId);
    return { success: true };
  }

  @Put('deals/:id/stage')
  async moveDealToStage(
    @Param('id') id: string,
    @Body() body: { stage: string },
    @TenantId() tenantId: string,
  ): Promise<Deal> {
    return this.crmService.moveDealToStage(id, body.stage, tenantId);
  }

  // Activity endpoints
  @Get('activities')
  async listActivities(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dealId') dealId?: string,
  ): Promise<{ activities: Activity[]; total: number; page: number; limit: number }> {
    return this.crmService.listActivities(tenantId, {
      page,
      limit,
      type,
      status,
      customerId,
      dealId,
    });
  }

  @Get('activities/:id')
  async getActivity(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Activity | null> {
    return this.crmService.getActivity(id, tenantId);
  }

  @Post('activities')
  async createActivity(
    @Body() activityData: Partial<Activity>,
    @TenantId() tenantId: string,
  ): Promise<Activity> {
    return this.crmService.createActivity(activityData, tenantId);
  }

  @Put('activities/:id')
  async updateActivity(
    @Param('id') id: string,
    @Body() activityData: Partial<Activity>,
    @TenantId() tenantId: string,
  ): Promise<Activity> {
    return this.crmService.updateActivity(id, activityData, tenantId);
  }

  @Delete('activities/:id')
  async deleteActivity(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.crmService.deleteActivity(id, tenantId);
    return { success: true };
  }

  @Put('activities/:id/complete')
  async completeActivity(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Activity> {
    return this.crmService.completeActivity(id, tenantId);
  }

  // Analytics endpoints
  @Get('analytics/pipeline')
  async getPipelineAnalytics(
    @TenantId() tenantId: string,
  ): Promise<{
    stages: Array<{ stage: string; count: number; value: number }>;
    totalValue: number;
    totalDeals: number;
  }> {
    return this.crmService.getPipelineAnalytics(tenantId);
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(
    @TenantId() tenantId: string,
    @Query('timeWindow') timeWindow: number = 30,
  ): Promise<{
    currentRevenue: number;
    previousRevenue: number;
    growth: number;
    dailyRevenue: Array<{ date: string; revenue: number }>;
  }> {
    return this.crmService.getRevenueAnalytics(tenantId, timeWindow);
  }

  @Get('analytics/activities')
  async getActivityAnalytics(
    @TenantId() tenantId: string,
  ): Promise<{
    totalActivities: number;
    completedActivities: number;
    pendingActivities: number;
    completionRate: number;
    activityTypes: Array<{ type: string; count: number }>;
  }> {
    return this.crmService.getActivityAnalytics(tenantId);
  }

  // AI-powered insights
  @Post('insights/customer-analysis')
  async getCustomerInsights(
    @Param('customerId') customerId: string,
    @TenantId() tenantId: string,
  ): Promise<{ insights: string; recommendations: string[] }> {
    const customer = await this.crmService.getCustomer(customerId, tenantId);
    const activities = await this.crmService.getCustomerActivities(customerId, tenantId);
    const deals = await this.crmService.getCustomerDeals(customerId, tenantId);

    const prompt = `Analyze this customer profile and provide insights:
Customer: ${customer?.name}
Email: ${customer?.email}
Activities: ${activities.length}
Deals: ${deals.length} (${deals.filter(d => d.stage === 'won').length} won)
Status: ${customer?.status}`;

    const aiResponse = await this.aiService.generateText(prompt, {
      maxTokens: 200,
      temperature: 0.7,
    });

    return {
      insights: aiResponse.content,
      recommendations: [
        'Follow up on pending activities',
        'Review deal pipeline progression',
        'Update customer information',
      ],
    };
  }
}
