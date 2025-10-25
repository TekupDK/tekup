import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ConsentRecord } from './entities/consent-record.entity';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Data Export (Right to Data Portability)
  async requestDataExport(userId: string, email: string): Promise<DataExportRequest> {
    const existingRequest = await this.prisma.renosDataExportRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return existingRequest;
    }

    const request = await this.prisma.renosDataExportRequest.create({
      data: {
        userId,
        email,
        status: 'pending',
      },
    });

    // Background processing would be implemented here
    this.logger.log(`Data export requested for user ${userId}`);

    return request;
  }

  async getDataExportStatus(userId: string): Promise<DataExportRequest | null> {
    return this.prisma.renosDataExportRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Data Deletion (Right to be Forgotten)
  async requestDataDeletion(userId: string, email: string, reason?: string): Promise<DataDeletionRequest> {
    const existingRequest = await this.prisma.renosDataDeletionRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (existingRequest) {
      return existingRequest;
    }

    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

    const request = await this.prisma.renosDataDeletionRequest.create({
      data: {
        userId,
        email,
        scheduledDeletionDate,
        reason,
        status: 'pending',
      },
    });

    this.logger.log(`Data deletion requested for user ${userId}, scheduled for ${scheduledDeletionDate}`);

    return request;
  }

  async cancelDataDeletion(userId: string): Promise<boolean> {
    const request = await this.prisma.renosDataDeletionRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (!request) {
      throw new NotFoundException('No pending deletion request found');
    }

    await this.prisma.renosDataDeletionRequest.update({
      where: { id: request.id },
      data: { status: 'cancelled' },
    });

    this.logger.log(`Data deletion cancelled for user ${userId}`);

    return true;
  }

  // Consent Management
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string = '1.0',
  ): Promise<ConsentRecord> {
    const existingConsent = await this.prisma.renosConsentRecord.findFirst({
      where: {
        userId,
        consentType,
        granted: true,
        revokedAt: null,
      },
    });

    if (existingConsent && !granted) {
      await this.prisma.renosConsentRecord.update({
        where: { id: existingConsent.id },
        data: { revokedAt: new Date() },
      });
    }

    const consent = await this.prisma.renosConsentRecord.create({
      data: {
        userId,
        consentType,
        granted,
        ipAddress,
        userAgent,
        version,
      },
    });

    this.logger.log(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);

    return consent;
  }

  async getConsentStatus(userId: string, consentType?: string): Promise<ConsentRecord[]> {
    return this.prisma.renosConsentRecord.findMany({
      where: {
        userId,
        ...(consentType && { consentType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Privacy Policy
  async getPrivacyPolicy(version?: string): Promise<any> {
    if (version) {
      const policy = await this.prisma.renosPrivacyPolicy.findUnique({
        where: { version },
      });

      if (!policy) {
        throw new NotFoundException(`Privacy policy version ${version} not found`);
      }

      return policy;
    }

    const activePolicy = await this.prisma.renosPrivacyPolicy.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activePolicy) {
      throw new NotFoundException('No active privacy policy found');
    }

    return activePolicy;
  }

  async updatePrivacyPolicy(content: string, version: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.renosPrivacyPolicy.updateMany({
        where: { active: true },
        data: { active: false },
      });

      await tx.renosPrivacyPolicy.create({
        data: {
          version,
          content,
          active: true,
        },
      });
    });

    this.logger.log(`Privacy policy updated to version ${version}`);
  }

  // Admin operations
  async cleanupExpiredData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.renosDataExportRequest.deleteMany({
      where: {
        status: 'completed',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired export requests`);
  }

  async processScheduledDeletions(): Promise<void> {
    const requests = await this.prisma.renosDataDeletionRequest.findMany({
      where: {
        status: 'pending',
        scheduledDeletionDate: {
          lte: new Date(),
        },
      },
    });

    for (const request of requests) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.renosDataDeletionRequest.update({
            where: { id: request.id },
            data: { status: 'processing' },
          });

          // Delete user data (cascade will handle related records)
          await tx.renosUser.delete({
            where: { id: request.userId },
          });

          await tx.renosDataDeletionRequest.update({
            where: { id: request.id },
            data: { status: 'completed' },
          });
        });

        this.logger.log(`User ${request.userId} data deleted successfully`);
      } catch (error) {
        this.logger.error(`Failed to delete user ${request.userId} data:`, error);
      }
    }
  }
}
