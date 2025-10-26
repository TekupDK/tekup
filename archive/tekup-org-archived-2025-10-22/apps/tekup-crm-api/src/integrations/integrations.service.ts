import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private prisma: PrismaService) {}

  async registerIntegration(tenantId: string, integrationName: string, config: any) {
    try {
      // Check if integration already exists for this tenant
      const existingIntegration = await this.prisma.Integration.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: integrationName,
          },
        },
      });

      if (existingIntegration) {
        // Update existing integration
        const updatedIntegration = await this.prisma.Integration.update({
          where: {
            id: existingIntegration.id,
          },
          data: {
            config,
            updatedAt: new Date(),
          },
        });

        this.logger.log(`Updated integration ${integrationName} for tenant ${tenantId}`);
        return updatedIntegration;
      } else {
        // Create new integration
        const newIntegration = await this.prisma.Integration.create({
          data: {
            tenantId,
            name: integrationName,
            config,
          },
        });

        this.logger.log(`Created integration ${integrationName} for tenant ${tenantId}`);
        return newIntegration;
      }
    } catch (error) {
      this.logger.error(`Failed to register integration: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getIntegration(tenantId: string, integrationName: string) {
    try {
      const integration = await this.prisma.Integration.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: integrationName,
          },
        },
      });

      return integration;
    } catch (error) {
      this.logger.error(`Failed to get integration: ${error.message}`, error.stack);
      throw error;
    }
  }

  async syncWithThirdParty(tenantId: string, integrationName: string, data: any) {
    try {
      // Get integration config
      const integration = await this.getIntegration(tenantId, integrationName);
      
      if (!integration) {
        throw new Error(`Integration ${integrationName} not found for tenant ${tenantId}`);
      }

      // In a real implementation, this would make API calls to the third-party service
      // For now, we'll just log the sync attempt
      this.logger.log(`Syncing data with ${integrationName} for tenant ${tenantId}`, {
        data,
        config: integration.config,
      });

      // Return success response
      return {
        success: true,
        message: `Data synced with ${integrationName}`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to sync with third-party: ${error.message}`, error.stack);
      throw error;
    }
  }
}