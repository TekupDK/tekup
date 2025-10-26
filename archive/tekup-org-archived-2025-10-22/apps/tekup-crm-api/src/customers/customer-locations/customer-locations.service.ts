import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerLocationDto } from './dto/create-customer-location.dto';
import { UpdateCustomerLocationDto } from './dto/update-customer-location.dto';
import { DanishBusinessUtils } from '../../danish-business/danish-business.utils';
import { CleaningType, VisitFrequency } from '@prisma/client';

@Injectable()
export class CustomerLocationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new customer location
   */
  async create(tenantId: string, customerId: string, createLocationDto: CreateCustomerLocationDto) {
    const { 
      name, 
      address, 
      city, 
      postalCode, 
      squareMeters,
      cleaningType,
      visitFrequency,
      specialRequirements 
    } = createLocationDto;

    // Validate Danish postal code if provided
    if (postalCode && !DanishBusinessUtils.isValidPostalCode(postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Get city from postal code if not provided
    const cityFromPostalCode = postalCode ? DanishBusinessUtils.getCityFromPostalCode(postalCode) : null;
    const finalCity = city || cityFromPostalCode;

    return this.prisma.customerLocation.create({
      data: {
        customerId,
        name,
        address,
        city: finalCity,
        postalCode,
        squareMeters: squareMeters ? parseInt(squareMeters.toString()) : null,
        cleaningType: cleaningType || 'OFFICE',
        visitFrequency: visitFrequency || 'WEEKLY',
        specialRequirements: specialRequirements || [],
      },
    });
  }

  /**
   * Get all locations for a customer
   */
  async findAll(tenantId: string, customerId: string) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerLocation.findMany({
      where: { customerId },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get location by ID
   */
  async findOne(tenantId: string, customerId: string, locationId: string) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const location = await this.prisma.customerLocation.findFirst({
      where: { id: locationId, customerId },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  /**
   * Update location
   */
  async update(
    tenantId: string, 
    customerId: string, 
    locationId: string, 
    updateLocationDto: UpdateCustomerLocationDto
  ) {
    const location = await this.findOne(tenantId, customerId, locationId);

    // Validate Danish postal code if provided
    if (updateLocationDto.postalCode && !DanishBusinessUtils.isValidPostalCode(updateLocationDto.postalCode)) {
      throw new BadRequestException('Invalid Danish postal code');
    }

    // Get city from postal code if not provided
    const cityFromPostalCode = updateLocationDto.postalCode ? 
      DanishBusinessUtils.getCityFromPostalCode(updateLocationDto.postalCode) : null;
    const finalCity = updateLocationDto.city || cityFromPostalCode;

    return this.prisma.customerLocation.update({
      where: { id: locationId },
      data: {
        ...updateLocationDto,
        city: finalCity,
        squareMeters: updateLocationDto.squareMeters ? parseInt(updateLocationDto.squareMeters.toString()) : updateLocationDto.squareMeters,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });
  }

  /**
   * Delete location (soft delete)
   */
  async remove(tenantId: string, customerId: string, locationId: string) {
    const location = await this.findOne(tenantId, customerId, locationId);

    return this.prisma.customerLocation.update({
      where: { id: locationId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get locations by cleaning type
   */
  async findByCleaningType(tenantId: string, customerId: string, cleaningType: CleaningType) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerLocation.findMany({
      where: { customerId, cleaningType, isActive: true },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get locations by visit frequency
   */
  async findByVisitFrequency(tenantId: string, customerId: string, visitFrequency: VisitFrequency) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerLocation.findMany({
      where: { customerId, visitFrequency, isActive: true },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get active locations count for customer
   */
  async getActiveLocationsCount(tenantId: string, customerId: string) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerLocation.count({
      where: { customerId, isActive: true },
    });
  }
}
