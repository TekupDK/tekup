import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { DanishBusinessUtils } from '../danish-business/danish-business.utils';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tenant
   */
  async create(createTenantDto: CreateTenantDto) {
    const { name, domain, cvrNumber, address, city, postalCode, phone, email } = createTenantDto;

    // Validate Danish postal code if provided
    if (postalCode && !DanishBusinessUtils.isValidPostalCode(postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Validate Danish phone number if provided
    if (phone && !DanishBusinessUtils.isValidDanishPhone(phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check if domain already exists
    if (domain) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { domain },
      });

      if (existingTenant) {
        throw new ForbiddenException('Domain already exists');
      }
    }

    // Check if CVR number already exists
    if (cvrNumber) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { cvrNumber },
      });

      if (existingTenant) {
        throw new ForbiddenException('CVR number already exists');
      }
    }

    return this.prisma.tenant.create({
      data: {
        name,
        domain,
        cvrNumber,
        address,
        city,
        postalCode,
        phone: phone ? DanishBusinessUtils.formatDanishPhone(phone) : phone,
        email,
      },
    });
  }

  /**
   * Get all tenants (admin only)
   */
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              customers: true,
              jobs: true,
            },
          },
        },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tenant by ID
   */
  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            jobs: true,
            teamMembers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);

    // Validate Danish postal code if provided
    if (updateTenantDto.postalCode && !DanishBusinessUtils.isValidPostalCode(updateTenantDto.postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Validate Danish phone number if provided
    if (updateTenantDto.phone && !DanishBusinessUtils.isValidDanishPhone(updateTenantDto.phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check domain uniqueness if updating
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { domain: updateTenantDto.domain },
      });

      if (existingTenant) {
        throw new ForbiddenException('Domain already exists');
      }
    }

    // Check CVR number uniqueness if updating
    if (updateTenantDto.cvrNumber && updateTenantDto.cvrNumber !== tenant.cvrNumber) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { cvrNumber: updateTenantDto.cvrNumber },
      });

      if (existingTenant) {
        throw new ForbiddenException('CVR number already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...updateTenantDto,
        phone: updateTenantDto.phone ? DanishBusinessUtils.formatDanishPhone(updateTenantDto.phone) : updateTenantDto.phone,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete tenant (soft delete)
   */
  async remove(id: string) {
    const tenant = await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get tenant statistics
   */
  async getStatistics(id: string) {
    const tenant = await this.findOne(id);

    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      activeCustomers,
      totalJobs,
      completedJobs,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.user.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.customer.count({ where: { tenantId: id } }),
      this.prisma.customer.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.cleaningJob.count({ where: { tenantId: id } }),
      this.prisma.cleaningJob.count({ where: { tenantId: id, status: 'COMPLETED' } }),
      this.prisma.cleaningJob.aggregate({
        where: { tenantId: id, status: 'COMPLETED' },
        _sum: { costDetails: true },
      }),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        subscriptionTier: tenant.subscriptionTier,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        },
        revenue: {
          total: totalRevenue._sum.costDetails || 0,
        },
      },
    };
  }

  /**
   * Get tenant by domain
   */
  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Check if tenant exists and is active
   */
  async isTenantActive(id: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { isActive: true },
    });

    return tenant?.isActive || false;
  }
}
