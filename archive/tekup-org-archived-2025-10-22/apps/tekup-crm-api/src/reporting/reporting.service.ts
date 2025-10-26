import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private prisma: PrismaService) {}

  async getSalesPerformanceReport(tenantId: string, startDate: Date, endDate: Date) {
    try {
      // Get deals closed in the period
      const closedDeals = await this.prisma.Deal.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          stage: {
            isClosed: true,
            isWon: true,
          },
        },
        include: {
          company: true,
          stage: true,
        },
      });

      // Calculate total value
      const totalValue = closedDeals.reduce((sum, deal) => sum + deal.value, 0);

      // Group by stage
      const dealsByStage = closedDeals.reduce((acc, deal) => {
        const stageName = deal.stage.name;
        if (!acc[stageName]) {
          acc[stageName] = { count: 0, value: 0 };
        }
        acc[stageName].count += 1;
        acc[stageName].value += deal.value;
        return acc;
      }, {});

      // Get top companies by deal value
      const companyDealValues = closedDeals.reduce((acc, deal) => {
        const companyName = deal.company.name;
        if (!acc[companyName]) {
          acc[companyName] = 0;
        }
        acc[companyName] += deal.value;
        return acc;
      }, {});

      const topCompanies = Object.entries(companyDealValues)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      return {
        totalDeals: closedDeals.length,
        totalValue,
        dealsByStage,
        topCompanies,
      };
    } catch (error) {
      this.logger.error(`Failed to generate sales performance report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDealConversionReport(tenantId: string) {
    try {
      // Get all deal stages
      const stages = await this.prisma.DealStage.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Get deals in each stage
      const stageDealCounts = {};
      let totalDeals = 0;

      for (const stage of stages) {
        const dealCount = await this.prisma.Deal.count({
          where: {
            tenantId,
            stageId: stage.id,
          },
        });

        stageDealCounts[stage.name] = dealCount;
        totalDeals += dealCount;
      }

      // Calculate conversion rates
      const conversionRates = {};
      let previousCount = totalDeals;

      for (const stage of stages) {
        const currentCount = stageDealCounts[stage.name];
        const conversionRate = previousCount > 0 ? (currentCount / previousCount) * 100 : 0;
        conversionRates[stage.name] = {
          count: currentCount,
          conversionRate: conversionRate.toFixed(2),
        };
        previousCount = currentCount;
      }

      return {
        totalDeals,
        stages: conversionRates,
      };
    } catch (error) {
      this.logger.error(`Failed to generate deal conversion report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getActivityCompletionReport(tenantId: string, startDate: Date, endDate: Date) {
    try {
      // Get all activities in the period
      const allActivities = await this.prisma.Activity.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          activityType: true,
        },
      });

      // Get completed activities
      const completedActivities = allActivities.filter(
        (activity) => activity.completedAt !== null,
      );

      // Calculate completion rate
      const completionRate =
        allActivities.length > 0
          ? (completedActivities.length / allActivities.length) * 100
          : 0;

      // Group by activity type
      const activitiesByType = allActivities.reduce((acc, activity) => {
        const typeName = activity.activityType.name;
        if (!acc[typeName]) {
          acc[typeName] = { total: 0, completed: 0 };
        }
        acc[typeName].total += 1;
        if (activity.completedAt) {
          acc[typeName].completed += 1;
        }
        return acc;
      }, {});

      // Calculate completion rates by type
      const completionRatesByType = {};
      for (const [typeName, counts] of Object.entries(activitiesByType)) {
        const rate =
          counts['total'] > 0 ? (counts['completed'] / counts['total']) * 100 : 0;
        completionRatesByType[typeName] = {
          total: counts['total'],
          completed: counts['completed'],
          completionRate: rate.toFixed(2),
        };
      }

      return {
        totalActivities: allActivities.length,
        completedActivities: completedActivities.length,
        completionRate: completionRate.toFixed(2),
        byType: completionRatesByType,
      };
    } catch (error) {
      this.logger.error(`Failed to generate activity completion report: ${error.message}`, error.stack);
      throw error;
    }
  }
}