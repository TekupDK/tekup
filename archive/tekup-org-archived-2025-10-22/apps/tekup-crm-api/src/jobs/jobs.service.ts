import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { DanishBusinessUtils } from '../danish-business/danish-business.utils';
import { CleaningJobType, JobStatus, JobPriority } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new cleaning job
   */
  async create(tenantId: string, createJobDto: CreateJobDto) {
    const {
      customerId,
      locationId,
      title,
      description,
      jobType,
      priority,
      scheduledDate,
      scheduledTime,
      estimatedDuration,
      locationDetails,
      recurringConfig,
      equipmentRequirements,
      supplyRequirements,
      specialRequirements,
      costDetails,
    } = createJobDto;

    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify location exists and belongs to customer (if provided)
    if (locationId) {
      const location = await this.prisma.customerLocation.findFirst({
        where: { id: locationId, customerId },
      });

      if (!location) {
        throw new NotFoundException('Customer location not found');
      }
    }

    // Get standard duration if not provided
    const finalDuration = estimatedDuration || DanishBusinessUtils.getStandardJobDuration(jobType);

    // Validate scheduled date is not in the past
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime < new Date()) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    // Check if it's a Danish holiday
    const isHoliday = DanishBusinessUtils.isDanishHoliday(scheduledDateTime);
    if (isHoliday && recurringConfig?.skipHolidays) {
      throw new BadRequestException('Cannot schedule job on Danish holiday when skipHolidays is enabled');
    }

    // Calculate cost if not provided
    const finalCostDetails = costDetails || {
      basePrice: 0,
      hourlyRate: DanishBusinessUtils.getStandardHourlyRate('CLEANER'),
      supplies: 0,
      equipment: 0,
      total: 0,
      currency: 'DKK',
      invoiced: false,
    };

    return this.prisma.cleaningJob.create({
      data: {
        tenantId,
        customerId,
        locationId,
        title,
        description,
        jobType,
        priority: priority || 'NORMAL',
        scheduledDate: scheduledDateTime,
        scheduledTime,
        estimatedDuration: finalDuration,
        locationDetails: locationDetails ? JSON.parse(JSON.stringify(locationDetails)) : null,
        recurringConfig: recurringConfig ? JSON.parse(JSON.stringify(recurringConfig)) : null,
        equipmentRequirements: equipmentRequirements ? JSON.parse(JSON.stringify(equipmentRequirements)) : null,
        supplyRequirements: supplyRequirements ? JSON.parse(JSON.stringify(supplyRequirements)) : null,
        specialRequirements: specialRequirements || [],
        costDetails: JSON.parse(JSON.stringify(finalCostDetails)),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        location: {
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
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
                phone: true,
                skills: true,
              },
            },
          },
        },
        _count: {
          select: {
            photos: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Get all jobs for a tenant
   */
  async findAll(tenantId: string, page = 1, limit = 10, status?: JobStatus, jobType?: CleaningJobType) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (jobType) {
      where.jobType = jobType;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.cleaningJob.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
            },
          },
          teamMembers: {
            include: {
              teamMember: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              photos: true,
              notes: true,
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      }),
      this.prisma.cleaningJob.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get job by ID
   */
  async findOne(tenantId: string, id: string) {
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            cleaningPreferences: true,
            accessInstructions: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            cleaningType: true,
            visitFrequency: true,
            specialRequirements: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
                phone: true,
                email: true,
                skills: true,
                certifications: true,
              },
            },
          },
        },
        photos: {
          orderBy: { uploadedAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        calendarEvent: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  /**
   * Update job
   */
  async update(tenantId: string, id: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(tenantId, id);

    // Validate scheduled date if updating
    if (updateJobDto.scheduledDate) {
      const scheduledDateTime = new Date(updateJobDto.scheduledDate);
      if (scheduledDateTime < new Date()) {
        throw new BadRequestException('Scheduled date cannot be in the past');
      }

      // Check if it's a Danish holiday
      const isHoliday = DanishBusinessUtils.isDanishHoliday(scheduledDateTime);
      if (isHoliday && job.recurringConfig?.skipHolidays) {
        throw new BadRequestException('Cannot schedule job on Danish holiday when skipHolidays is enabled');
      }
    }

    return this.prisma.cleaningJob.update({
      where: { id },
      data: {
        ...updateJobDto,
        scheduledDate: updateJobDto.scheduledDate ? new Date(updateJobDto.scheduledDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            photos: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Delete job (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const job = await this.findOne(tenantId, id);

    return this.prisma.cleaningJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get jobs by status
   */
  async findByStatus(tenantId: string, status: JobStatus) {
    return this.prisma.cleaningJob.findMany({
      where: { tenantId, status },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   * Get jobs by customer
   */
  async findByCustomer(tenantId: string, customerId: string) {
    return this.prisma.cleaningJob.findMany({
      where: { tenantId, customerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  /**
   * Get jobs by date range
   */
  async findByDateRange(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.prisma.cleaningJob.findMany({
      where: {
        tenantId,
        scheduledDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   * Update job status
   */
  async updateStatus(tenantId: string, id: string, status: JobStatus, completedAt?: Date) {
    const job = await this.findOne(tenantId, id);

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'COMPLETED' && completedAt) {
      updateData.completedAt = completedAt;
    }

    return this.prisma.cleaningJob.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        teamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get job statistics
   */
  async getStatistics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalJobs,
      completedJobs,
      cancelledJobs,
      totalRevenue,
      averageDuration,
    ] = await Promise.all([
      this.prisma.cleaningJob.count({ where }),
      this.prisma.cleaningJob.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.cleaningJob.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.cleaningJob.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { costDetails: true },
      }),
      this.prisma.cleaningJob.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { actualDuration: true },
      }),
    ]);

    return {
      totalJobs,
      completedJobs,
      cancelledJobs,
      inProgressJobs: await this.prisma.cleaningJob.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      scheduledJobs: await this.prisma.cleaningJob.count({ where: { ...where, status: 'SCHEDULED' } }),
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      totalRevenue: totalRevenue._sum.costDetails || 0,
      averageDuration: averageDuration._avg.actualDuration || 0,
    };
  }
}
