import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { RouteStatus } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new route
   */
  async create(tenantId: string, createRouteDto: CreateRouteDto) {
    const {
      teamMemberId,
      date,
      jobIds,
      startLocation,
      endLocation,
    } = createRouteDto;

    // Verify team member exists and belongs to tenant
    const teamMember = await this.prisma.teamMember.findFirst({
      where: { id: teamMemberId, tenantId },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Verify all jobs exist and belong to tenant
    const jobs = await this.prisma.cleaningJob.findMany({
      where: {
        id: { in: jobIds },
        tenantId,
      },
      include: {
        customer: true,
        location: true,
      },
    });

    if (jobs.length !== jobIds.length) {
      throw new BadRequestException('One or more jobs not found');
    }

    // Calculate route details
    const routeDetails = await this.calculateRouteDetails(jobs, startLocation, endLocation);

    // Create route
    const route = await this.prisma.route.create({
      data: {
        tenantId,
        teamMemberId,
        date: new Date(date),
        estimatedDuration: routeDetails.estimatedDuration,
        estimatedDistance: routeDetails.estimatedDistance,
        estimatedCost: routeDetails.estimatedCost,
        startLocation: startLocation ? JSON.parse(JSON.stringify(startLocation)) : null,
        endLocation: endLocation ? JSON.parse(JSON.stringify(endLocation)) : null,
      },
    });

    // Create route job assignments
    const routeJobs = await Promise.all(
      jobIds.map((jobId, index) =>
        this.prisma.routeJob.create({
          data: {
            routeId: route.id,
            jobId,
            order: index + 1,
          },
        })
      )
    );

    return {
      ...route,
      teamMember: {
        id: teamMember.id,
        name: teamMember.name,
        role: teamMember.role,
        phone: teamMember.phone,
      },
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        jobType: job.jobType,
        status: job.status,
        scheduledDate: job.scheduledDate,
        customer: job.customer,
        location: job.location,
      })),
      routeJobs,
    };
  }

  /**
   * Get all routes for a tenant
   */
  async findAll(tenantId: string, page = 1, limit = 10, status?: RouteStatus) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take: limit,
        include: {
          teamMember: {
            select: {
              id: true,
              name: true,
              role: true,
              phone: true,
            },
          },
          routeJobs: {
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  jobType: true,
                  status: true,
                  scheduledDate: true,
                  customer: {
                    select: {
                      id: true,
                      name: true,
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
                    },
                  },
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      data: routes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get route by ID
   */
  async findOne(tenantId: string, id: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, tenantId },
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
        routeJobs: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobType: true,
                status: true,
                scheduledDate: true,
                estimatedDuration: true,
                costDetails: true,
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
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  /**
   * Update route
   */
  async update(tenantId: string, id: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.findOne(tenantId, id);

    return this.prisma.route.update({
      where: { id },
      data: {
        ...updateRouteDto,
        updatedAt: new Date(),
      },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
          },
        },
        routeJobs: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobType: true,
                status: true,
                scheduledDate: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Delete route
   */
  async remove(tenantId: string, id: string) {
    const route = await this.findOne(tenantId, id);

    // Delete route jobs first
    await this.prisma.routeJob.deleteMany({
      where: { routeId: id },
    });

    return this.prisma.route.delete({
      where: { id },
    });
  }

  /**
   * Optimize route
   */
  async optimize(tenantId: string, optimizeRouteDto: OptimizeRouteDto) {
    const { routeId, algorithm = 'balanced' } = optimizeRouteDto;

    const route = await this.findOne(tenantId, routeId);

    if (route.status !== 'PLANNED') {
      throw new BadRequestException('Can only optimize planned routes');
    }

    // Get all jobs in the route
    const jobs = route.routeJobs.map(rj => rj.job);

    // Calculate different optimization strategies
    const optimizations = await this.calculateOptimizations(jobs, algorithm);

    // Update route with optimization data
    const updatedRoute = await this.prisma.route.update({
      where: { id: routeId },
      data: {
        optimizationData: JSON.parse(JSON.stringify(optimizations)),
        updatedAt: new Date(),
      },
    });

    return {
      route: updatedRoute,
      optimization: optimizations,
    };
  }

  /**
   * Get routes by team member
   */
  async getTeamMemberRoutes(tenantId: string, teamMemberId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, teamMemberId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.route.findMany({
      where,
      include: {
        routeJobs: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobType: true,
                status: true,
                scheduledDate: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
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
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get route statistics
   */
  async getRouteStatistics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalRoutes,
      completedRoutes,
      totalDistance,
      totalCost,
      averageEfficiency,
    ] = await Promise.all([
      this.prisma.route.count({ where }),
      this.prisma.route.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.route.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { estimatedDistance: true },
      }),
      this.prisma.route.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { estimatedCost: true },
      }),
      this.prisma.route.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { estimatedDistance: true },
      }),
    ]);

    return {
      totalRoutes,
      completedRoutes,
      completionRate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
      totalDistance: totalDistance._sum.estimatedDistance || 0,
      totalCost: totalCost._sum.estimatedCost || 0,
      averageDistance: averageEfficiency._avg.estimatedDistance || 0,
    };
  }

  /**
   * Calculate route details
   */
  private async calculateRouteDetails(jobs: any[], startLocation?: any, endLocation?: any) {
    // This is a simplified calculation
    // In a real implementation, you would use a routing service like Google Maps API
    
    const baseDuration = 30; // 30 minutes base time
    const jobDuration = jobs.reduce((total, job) => total + (job.estimatedDuration || 0), 0);
    const travelTime = jobs.length * 15; // 15 minutes between jobs
    
    const estimatedDuration = baseDuration + jobDuration + travelTime;
    const estimatedDistance = jobs.length * 5; // 5 km between jobs (simplified)
    const estimatedCost = estimatedDistance * 2.5; // 2.5 DKK per km

    return {
      estimatedDuration,
      estimatedDistance,
      estimatedCost,
    };
  }

  /**
   * Calculate different optimization strategies
   */
  private async calculateOptimizations(jobs: any[], algorithm: string) {
    // This is a simplified optimization
    // In a real implementation, you would use advanced algorithms like TSP
    
    const originalOrder = jobs.map((job, index) => ({ job, order: index + 1 }));
    
    let optimizedOrder;
    
    switch (algorithm) {
      case 'shortest_distance':
        // Sort by postal code to minimize distance
        optimizedOrder = [...originalOrder].sort((a, b) => {
          const postalA = a.job.customer?.postalCode || a.job.location?.postalCode || '0000';
          const postalB = b.job.customer?.postalCode || b.job.location?.postalCode || '0000';
          return postalA.localeCompare(postalB);
        });
        break;
      case 'shortest_time':
        // Sort by scheduled time
        optimizedOrder = [...originalOrder].sort((a, b) => 
          new Date(a.job.scheduledDate).getTime() - new Date(b.job.scheduledDate).getTime()
        );
        break;
      case 'balanced':
      default:
        // Balanced approach - consider both distance and time
        optimizedOrder = [...originalOrder].sort((a, b) => {
          const timeA = new Date(a.job.scheduledDate).getTime();
          const timeB = new Date(b.job.scheduledDate).getTime();
          const postalA = a.job.customer?.postalCode || a.job.location?.postalCode || '0000';
          const postalB = b.job.customer?.postalCode || b.job.location?.postalCode || '0000';
          
          // Weight: 70% time, 30% distance
          const timeScore = (timeA - timeB) * 0.7;
          const distanceScore = postalA.localeCompare(postalB) * 0.3;
          
          return timeScore + distanceScore;
        });
        break;
    }

    // Calculate savings
    const originalDistance = originalOrder.length * 5; // Simplified
    const optimizedDistance = optimizedOrder.length * 4; // Simplified - 20% improvement
    const timeSaved = Math.max(0, originalDistance - optimizedDistance) * 2; // 2 minutes per km saved
    const costSaved = Math.max(0, originalDistance - optimizedDistance) * 2.5; // 2.5 DKK per km saved

    return {
      algorithm,
      originalOrder: originalOrder.map(item => ({
        jobId: item.job.id,
        title: item.job.title,
        order: item.order,
      })),
      optimizedOrder: optimizedOrder.map((item, index) => ({
        jobId: item.job.id,
        title: item.job.title,
        order: index + 1,
      })),
      savings: {
        time: timeSaved,
        distance: Math.max(0, originalDistance - optimizedDistance),
        cost: costSaved,
      },
    };
  }
}
