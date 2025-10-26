import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { DanishBusinessUtils } from '../danish-business/danish-business.utils';
import { CustomerSegment, ServiceLevel } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new customer
   */
  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    const { 
      name, 
      segment, 
      email, 
      phone, 
      address, 
      city, 
      postalCode, 
      cvrNumber,
      annualContractValue,
      contractStart,
      contractEnd,
      serviceLevel,
      cleaningPreferences,
      accessInstructions,
      specialRequirements 
    } = createCustomerDto;

    // Validate Danish postal code if provided
    if (postalCode && !DanishBusinessUtils.isValidPostalCode(postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Validate Danish phone number if provided
    if (phone && !DanishBusinessUtils.isValidDanishPhone(phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check if customer already exists in tenant
    if (email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { email, tenantId },
      });

      if (existingCustomer) {
        throw new ForbiddenException('Customer with this email already exists in tenant');
      }
    }

    // Check if CVR number already exists in tenant
    if (cvrNumber) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { cvrNumber, tenantId },
      });

      if (existingCustomer) {
        throw new ForbiddenException('Customer with this CVR number already exists in tenant');
      }
    }

    // Get city from postal code if not provided
    const cityFromPostalCode = postalCode ? DanishBusinessUtils.getCityFromPostalCode(postalCode) : null;
    const finalCity = city || cityFromPostalCode;

    return this.prisma.customer.create({
      data: {
        tenantId,
        name,
        segment: segment || 'COMMERCIAL',
        email,
        phone: phone ? DanishBusinessUtils.formatDanishPhone(phone) : phone,
        address,
        city: finalCity,
        postalCode,
        cvrNumber,
        annualContractValue: annualContractValue ? parseFloat(annualContractValue.toString()) : null,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
        serviceLevel: serviceLevel || 'STANDARD',
        cleaningPreferences: cleaningPreferences ? JSON.parse(JSON.stringify(cleaningPreferences)) : null,
        accessInstructions,
        specialRequirements: specialRequirements || [],
      },
      include: {
        locations: true,
        _count: {
          select: {
            jobs: true,
            feedback: true,
          },
        },
      },
    });
  }

  /**
   * Get all customers for a tenant
   */
  async findAll(tenantId: string, page = 1, limit = 10, segment?: CustomerSegment) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (segment) {
      where.segment = segment;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
              cleaningType: true,
              visitFrequency: true,
            },
          },
          _count: {
            select: {
              jobs: true,
              feedback: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer by ID
   */
  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        locations: true,
        jobs: {
          take: 10,
          orderBy: { scheduledDate: 'desc' },
          select: {
            id: true,
            title: true,
            jobType: true,
            status: true,
            scheduledDate: true,
            costDetails: true,
          },
        },
        feedback: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            jobs: true,
            feedback: true,
            locations: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Update customer
   */
  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(tenantId, id);

    // Validate Danish postal code if provided
    if (updateCustomerDto.postalCode && !DanishBusinessUtils.isValidPostalCode(updateCustomerDto.postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Validate Danish phone number if provided
    if (updateCustomerDto.phone && !DanishBusinessUtils.isValidDanishPhone(updateCustomerDto.phone)) {
      throw new BadRequestException('Invalid Danish phone number');
    }

    // Check email uniqueness if updating
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { email: updateCustomerDto.email, tenantId },
      });

      if (existingCustomer) {
        throw new ForbiddenException('Customer with this email already exists in tenant');
      }
    }

    // Check CVR number uniqueness if updating
    if (updateCustomerDto.cvrNumber && updateCustomerDto.cvrNumber !== customer.cvrNumber) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { cvrNumber: updateCustomerDto.cvrNumber, tenantId },
      });

      if (existingCustomer) {
        throw new ForbiddenException('Customer with this CVR number already exists in tenant');
      }
    }

    // Get city from postal code if not provided
    const cityFromPostalCode = updateCustomerDto.postalCode ? 
      DanishBusinessUtils.getCityFromPostalCode(updateCustomerDto.postalCode) : null;
    const finalCity = updateCustomerDto.city || cityFromPostalCode;

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        phone: updateCustomerDto.phone ? DanishBusinessUtils.formatDanishPhone(updateCustomerDto.phone) : updateCustomerDto.phone,
        city: finalCity,
        updatedAt: new Date(),
      },
      include: {
        locations: true,
        _count: {
          select: {
            jobs: true,
            feedback: true,
          },
        },
      },
    });
  }

  /**
   * Delete customer (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const customer = await this.findOne(tenantId, id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get customers by segment
   */
  async findBySegment(tenantId: string, segment: CustomerSegment) {
    return this.prisma.customer.findMany({
      where: { tenantId, segment, isActive: true },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            cleaningType: true,
            visitFrequency: true,
          },
        },
        _count: {
          select: {
            jobs: true,
            feedback: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get customer statistics
   */
  async getStatistics(tenantId: string, customerId: string) {
    const customer = await this.findOne(tenantId, customerId);

    const [
      totalJobs,
      completedJobs,
      totalRevenue,
      averageRating,
      recentJobs,
    ] = await Promise.all([
      this.prisma.cleaningJob.count({
        where: { customerId, tenantId },
      }),
      this.prisma.cleaningJob.count({
        where: { customerId, tenantId, status: 'COMPLETED' },
      }),
      this.prisma.cleaningJob.aggregate({
        where: { customerId, tenantId, status: 'COMPLETED' },
        _sum: { costDetails: true },
      }),
      this.prisma.customerFeedback.aggregate({
        where: { customerId },
        _avg: { rating: true },
      }),
      this.prisma.cleaningJob.findMany({
        where: { customerId, tenantId },
        take: 5,
        orderBy: { scheduledDate: 'desc' },
        select: {
          id: true,
          title: true,
          jobType: true,
          status: true,
          scheduledDate: true,
          costDetails: true,
        },
      }),
    ]);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        segment: customer.segment,
        serviceLevel: customer.serviceLevel,
        isActive: customer.isActive,
      },
      statistics: {
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        },
        revenue: {
          total: totalRevenue._sum.costDetails || 0,
        },
        satisfaction: {
          averageRating: averageRating._avg.rating || 0,
        },
        recentJobs,
      },
    };
  }

  /**
   * Search customers
   */
  async search(tenantId: string, query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { postalCode: { contains: query } },
          ],
        },
        skip,
        take: limit,
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
            },
          },
          _count: {
            select: {
              jobs: true,
              feedback: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.customer.count({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { postalCode: { contains: query } },
          ],
        },
      }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get active customers count
   */
  async getActiveCustomersCount(tenantId: string) {
    return this.prisma.customer.count({
      where: { tenantId, isActive: true },
    });
  }
}
