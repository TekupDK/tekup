import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('beauty-services');

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createService(data: CreateServiceDto): Promise<any> {
    try {
      const service = await this.prisma.beautyService.create({
        data: {
          salonId: data.salonId,
          name: data.name,
          description: data.description,
          category: data.category,
          duration: data.duration,
          price: data.price,
          currency: 'DKK',
          requiresConsultation: data.requiresConsultation || false,
          bookable: true,
          status: 'ACTIVE'
        }
      });

      logger.info(`Beauty service created: ${service.id} - ${service.name}`);
      return service;
    } catch (error) {
      logger.error('Service creation failed:', error);
      throw error;
    }
  }

  async getServices(salonId?: string): Promise<any[]> {
    return this.prisma.beautyService.findMany({
      where: { 
        salonId: salonId || undefined,
        status: 'ACTIVE',
        bookable: true
      },
      include: {
        staffServices: {
          include: { staff: true }
        }
      },
      orderBy: { category: 'asc' }
    });
  }

  async getServiceById(id: string): Promise<any> {
    return this.prisma.beautyService.findUnique({
      where: { id },
      include: {
        salon: true,
        staffServices: {
          include: { staff: true }
        }
      }
    });
  }

  async updateService(id: string, data: UpdateServiceDto): Promise<any> {
    return this.prisma.beautyService.update({
      where: { id },
      data
    });
  }

  async deleteService(id: string): Promise<void> {
    await this.prisma.beautyService.update({
      where: { id },
      data: { status: 'INACTIVE', bookable: false }
    });
  }

  async assignStaffToService(serviceId: string, staffId: string): Promise<any> {
    return this.prisma.staffService.create({
      data: {
        serviceId,
        staffId
      }
    });
  }

  async removeStaffFromService(serviceId: string, staffId: string): Promise<void> {
    await this.prisma.staffService.delete({
      where: {
        staffId_serviceId: {
          staffId,
          serviceId
        }
      }
    });
  }

  async getServicesByCategory(category: string, salonId?: string): Promise<any[]> {
    return this.prisma.beautyService.findMany({
      where: {
        category,
        salonId: salonId || undefined,
        status: 'ACTIVE',
        bookable: true
      },
      include: {
        staffServices: {
          include: { staff: true }
        }
      }
    });
  }
}

export interface CreateServiceDto {
  salonId: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  requiresConsultation?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  category?: string;
  duration?: number;
  price?: number;
  requiresConsultation?: boolean;
  bookable?: boolean;
  status?: string;
}
