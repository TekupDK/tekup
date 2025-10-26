import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ValidationService {
  constructor(private prisma: PrismaService) {}

  async validateContactData(tenantId: string, email?: string, companyId?: string) {
    // Validate email format if provided
    if (email && !this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if contact with same email already exists in tenant
    if (email) {
      const existingContact = await this.prisma.Contact.findFirst({
        where: {
          tenantId,
          email,
        },
      });

      if (existingContact) {
        throw new BadRequestException('Contact with this email already exists');
      }
    }

    // Validate company exists if provided
    if (companyId) {
      const company = await this.prisma.Company.findUnique({
        where: {
          id: companyId,
          tenantId,
        },
      });

      if (!company) {
        throw new BadRequestException('Company not found');
      }
    }
  }

  async validateCompanyData(tenantId: string, name: string) {
    // Check if company with same name already exists in tenant
    const existingCompany = await this.prisma.Company.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existingCompany) {
      throw new BadRequestException('Company with this name already exists');
    }
  }

  async validateDealData(tenantId: string, companyId: string, stageId: string, value: number) {
    // Validate company exists
    const company = await this.prisma.Company.findUnique({
      where: {
        id: companyId,
        tenantId,
      },
    });

    if (!company) {
      throw new BadRequestException('Company not found');
    }

    // Validate deal stage exists
    const stage = await this.prisma.DealStage.findUnique({
      where: {
        id: stageId,
        tenantId,
      },
    });

    if (!stage) {
      throw new BadRequestException('Deal stage not found');
    }

    // Validate deal value is positive
    if (value <= 0) {
      throw new BadRequestException('Deal value must be positive');
    }
  }

  async validateActivityData(tenantId: string, activityTypeId: string, scheduledAt?: string) {
    // Validate activity type exists
    const activityType = await this.prisma.ActivityType.findUnique({
      where: {
        id: activityTypeId,
        tenantId,
      },
    });

    if (!activityType) {
      throw new BadRequestException('Activity type not found');
    }

    // Validate scheduled date is in the future
    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}