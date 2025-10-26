import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(private prisma: PrismaService) {}

  async getMobileDashboardData(tenantId: string, userId: string) {
    try {
      // Get recent contacts
      const recentContacts = await this.prisma.Contact.findMany({
        where: {
          tenantId,
        },
        take: 5,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Get upcoming activities
      const upcomingActivities = await this.prisma.Activity.findMany({
        where: {
          tenantId,
          scheduledAt: {
            gte: new Date(),
          },
        },
        take: 5,
        orderBy: {
          scheduledAt: 'asc',
        },
        include: {
          activityType: true,
        },
      });

      // Get active deals
      const activeDeals = await this.prisma.Deal.findMany({
        where: {
          tenantId,
          stage: {
            isClosed: false,
          },
        },
        take: 5,
        include: {
          company: true,
          stage: true,
        },
      });

      return {
        recentContacts,
        upcomingActivities,
        activeDeals,
      };
    } catch (error) {
      this.logger.error(`Failed to get mobile dashboard data: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchContacts(tenantId: string, query: string) {
    try {
      const contacts = await this.prisma.Contact.findMany({
        where: {
          tenantId,
          OR: [
            {
              firstName: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: query,
              },
            },
          ],
        },
        take: 20,
      });

      return contacts;
    } catch (error) {
      this.logger.error(`Failed to search contacts: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getOfflineData(tenantId: string, lastSyncedAt?: string) {
    try {
      const whereClause = lastSyncedAt
        ? {
            tenantId,
            OR: [
              {
                updatedAt: {
                  gte: new Date(lastSyncedAt),
                },
              },
              {
                createdAt: {
                  gte: new Date(lastSyncedAt),
                },
              },
            ],
          }
        : { tenantId };

      // Get contacts
      const contacts = await this.prisma.Contact.findMany({
        where: whereClause,
      });

      // Get companies
      const companies = await this.prisma.Company.findMany({
        where: whereClause,
      });

      // Get deal stages
      const dealStages = await this.prisma.DealStage.findMany({
        where: {
          tenantId,
        },
      });

      // Get activity types
      const activityTypes = await this.prisma.ActivityType.findMany({
        where: {
          tenantId,
        },
      });

      return {
        contacts,
        companies,
        dealStages,
        activityTypes,
      };
    } catch (error) {
      this.logger.error(`Failed to get offline data: ${error.message}`, error.stack);
      throw error;
    }
  }
}