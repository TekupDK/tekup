import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      // Job metrics
      totalJobs,
      completedJobs,
      cancelledJobs,
      inProgressJobs,
      scheduledJobs,
      
      // Revenue metrics
      totalRevenue,
      averageJobValue,
      
      // Team metrics
      activeTeamMembers,
      totalTeamMembers,
      
      // Customer metrics
      activeCustomers,
      totalCustomers,
      
      // Performance metrics
      averageJobDuration,
      onTimeCompletionRate,
      
      // Recent activity
      recentJobs,
      recentCustomers,
    ] = await Promise.all([
      // Job counts
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter } }),
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter, status: 'COMPLETED' } }),
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter, status: 'CANCELLED' } }),
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter, status: 'IN_PROGRESS' } }),
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter, status: 'SCHEDULED' } }),
      
      // Revenue
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter, status: 'COMPLETED' },
        _sum: { costDetails: true },
      }),
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter, status: 'COMPLETED' },
        _avg: { costDetails: true },
      }),
      
      // Team
      this.prisma.teamMember.count({ where: { tenantId, isActive: true } }),
      this.prisma.teamMember.count({ where: { tenantId } }),
      
      // Customers
      this.prisma.customer.count({ where: { tenantId, isActive: true } }),
      this.prisma.customer.count({ where: { tenantId } }),
      
      // Performance
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter, status: 'COMPLETED' },
        _avg: { actualDuration: true },
      }),
      this.calculateOnTimeCompletionRate(tenantId, startDate, endDate),
      
      // Recent activity
      this.prisma.cleaningJob.findMany({
        where: { ...where, ...dateFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.customer.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          segment: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      jobs: {
        total: totalJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
        inProgress: inProgressJobs,
        scheduled: scheduledJobs,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      },
      revenue: {
        total: totalRevenue._sum.costDetails || 0,
        average: averageJobValue._avg.costDetails || 0,
      },
      team: {
        active: activeTeamMembers,
        total: totalTeamMembers,
        utilization: activeTeamMembers > 0 ? (activeTeamMembers / totalTeamMembers) * 100 : 0,
      },
      customers: {
        active: activeCustomers,
        total: totalCustomers,
      },
      performance: {
        averageJobDuration: averageJobDuration._avg.actualDuration || 0,
        onTimeCompletionRate,
      },
      recentActivity: {
        jobs: recentJobs,
        customers: recentCustomers,
      },
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, status: 'COMPLETED' };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalRevenue,
      revenueByJobType,
      revenueByMonth,
      averageJobValue,
      topCustomers,
    ] = await Promise.all([
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter },
        _sum: { costDetails: true },
      }),
      this.prisma.cleaningJob.groupBy({
        by: ['jobType'],
        where: { ...where, ...dateFilter },
        _sum: { costDetails: true },
        _count: { jobType: true },
      }),
      this.getRevenueByMonth(tenantId, startDate, endDate),
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter },
        _avg: { costDetails: true },
      }),
      this.getTopCustomersByRevenue(tenantId, startDate, endDate),
    ]);

    return {
      total: totalRevenue._sum.costDetails || 0,
      average: averageJobValue._avg.costDetails || 0,
      byJobType: revenueByJobType.map(item => ({
        jobType: item.jobType,
        revenue: item._sum.costDetails || 0,
        count: item._count.jobType,
      })),
      byMonth: revenueByMonth,
      topCustomers,
    };
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      jobCompletionRate,
      averageJobDuration,
      teamUtilization,
      customerSatisfaction,
      routeEfficiency,
    ] = await Promise.all([
      this.calculateJobCompletionRate(tenantId, startDate, endDate),
      this.prisma.cleaningJob.aggregate({
        where: { ...where, ...dateFilter, status: 'COMPLETED' },
        _avg: { actualDuration: true },
      }),
      this.calculateTeamUtilization(tenantId, startDate, endDate),
      this.calculateCustomerSatisfaction(tenantId, startDate, endDate),
      this.calculateRouteEfficiency(tenantId, startDate, endDate),
    ]);

    return {
      jobCompletionRate,
      averageJobDuration: averageJobDuration._avg.actualDuration || 0,
      teamUtilization,
      customerSatisfaction,
      routeEfficiency,
    };
  }

  /**
   * Get job analytics by type
   */
  async getJobAnalyticsByType(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const jobTypeStats = await this.prisma.cleaningJob.groupBy({
      by: ['jobType'],
      where: { ...where, ...dateFilter },
      _count: { jobType: true },
      _sum: { 
        costDetails: true,
        actualDuration: true,
      },
      _avg: {
        actualDuration: true,
        costDetails: true,
      },
    });

    return jobTypeStats.map(stat => ({
      jobType: stat.jobType,
      count: stat._count.jobType,
      totalRevenue: stat._sum.costDetails || 0,
      totalDuration: stat._sum.actualDuration || 0,
      averageDuration: stat._avg.actualDuration || 0,
      averageRevenue: stat._avg.costDetails || 0,
    }));
  }

  /**
   * Get team performance analytics
   */
  async getTeamPerformanceAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const teamStats = await this.prisma.teamMember.findMany({
      where: { tenantId, isActive: true },
      include: {
        jobAssignments: {
          where: {
            job: {
              ...dateFilter,
            },
          },
          include: {
            job: {
              select: {
                id: true,
                status: true,
                actualDuration: true,
                costDetails: true,
                scheduledDate: true,
              },
            },
          },
        },
      },
    });

    return teamStats.map(member => {
      const jobs = member.jobAssignments.map(ja => ja.job);
      const completedJobs = jobs.filter(job => job.status === 'COMPLETED');
      const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.costDetails || 0), 0);
      const totalHours = completedJobs.reduce((sum, job) => sum + (job.actualDuration || 0), 0);

      return {
        teamMember: {
          id: member.id,
          name: member.name,
          role: member.role,
        },
        jobs: {
          total: jobs.length,
          completed: completedJobs.length,
          completionRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
        },
        revenue: {
          total: totalRevenue,
          average: completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0,
        },
        hours: {
          total: totalHours,
          average: completedJobs.length > 0 ? totalHours / completedJobs.length : 0,
        },
      };
    });
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalCustomers,
      customersBySegment,
      customerRetention,
      topCustomers,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.customer.groupBy({
        by: ['segment'],
        where: { tenantId, isActive: true },
        _count: { segment: true },
      }),
      this.calculateCustomerRetention(tenantId, startDate, endDate),
      this.getTopCustomersByRevenue(tenantId, startDate, endDate),
    ]);

    return {
      total: totalCustomers,
      bySegment: customersBySegment.map(item => ({
        segment: item.segment,
        count: item._count.segment,
      })),
      retention: customerRetention,
      topCustomers,
    };
  }

  /**
   * Calculate on-time completion rate
   */
  private async calculateOnTimeCompletionRate(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    const where: any = { tenantId, status: 'COMPLETED' };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const completedJobs = await this.prisma.cleaningJob.findMany({
      where: { ...where, ...dateFilter },
      select: {
        scheduledDate: true,
        completedAt: true,
      },
    });

    if (completedJobs.length === 0) return 0;

    const onTimeJobs = completedJobs.filter(job => {
      if (!job.completedAt) return false;
      
      const scheduled = new Date(job.scheduledDate);
      const completed = new Date(job.completedAt);
      const timeDiff = completed.getTime() - scheduled.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Consider on-time if completed within 2 hours of scheduled time
      return hoursDiff <= 2;
    });

    return (onTimeJobs.length / completedJobs.length) * 100;
  }

  /**
   * Calculate job completion rate
   */
  private async calculateJobCompletionRate(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [totalJobs, completedJobs] = await Promise.all([
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter } }),
      this.prisma.cleaningJob.count({ where: { ...where, ...dateFilter, status: 'COMPLETED' } }),
    ]);

    return totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  }

  /**
   * Calculate team utilization
   */
  private async calculateTeamUtilization(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    // This is a simplified calculation
    // In a real implementation, you would calculate based on working hours vs assigned hours
    const activeTeamMembers = await this.prisma.teamMember.count({
      where: { tenantId, isActive: true },
    });

    const totalJobs = await this.prisma.cleaningJob.count({
      where: { tenantId },
    });

    // Simplified utilization: jobs per team member
    return activeTeamMembers > 0 ? (totalJobs / activeTeamMembers) * 10 : 0; // 10 is a scaling factor
  }

  /**
   * Calculate customer satisfaction
   */
  private async calculateCustomerSatisfaction(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    const where: any = { tenantId };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const feedback = await this.prisma.customerFeedback.aggregate({
      where: { ...where, ...dateFilter },
      _avg: { rating: true },
    });

    return feedback._avg.rating || 0;
  }

  /**
   * Calculate route efficiency
   */
  private async calculateRouteEfficiency(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    const where: any = { tenantId, status: 'COMPLETED' };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const routes = await this.prisma.route.findMany({
      where: { ...where, ...dateFilter },
      select: {
        estimatedDistance: true,
        estimatedDuration: true,
      },
    });

    if (routes.length === 0) return 0;

    const totalDistance = routes.reduce((sum, route) => sum + (route.estimatedDistance || 0), 0);
    const totalDuration = routes.reduce((sum, route) => sum + (route.estimatedDuration || 0), 0);

    // Simplified efficiency: distance per hour (lower is better)
    const efficiency = totalDuration > 0 ? totalDistance / (totalDuration / 60) : 0;
    
    // Convert to percentage (assuming 50 km/h is 100% efficient)
    return Math.min(100, (50 / efficiency) * 100);
  }

  /**
   * Get revenue by month
   */
  private async getRevenueByMonth(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, status: 'COMPLETED' };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const jobs = await this.prisma.cleaningJob.findMany({
      where: { ...where, ...dateFilter },
      select: {
        scheduledDate: true,
        costDetails: true,
      },
    });

    // Group by month
    const monthlyRevenue = jobs.reduce((acc, job) => {
      const month = new Date(job.scheduledDate).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + (job.costDetails || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  /**
   * Get top customers by revenue
   */
  private async getTopCustomersByRevenue(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, status: 'COMPLETED' };
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const customerRevenue = await this.prisma.cleaningJob.groupBy({
      by: ['customerId'],
      where: { ...where, ...dateFilter },
      _sum: { costDetails: true },
      _count: { customerId: true },
    });

    const customerDetails = await Promise.all(
      customerRevenue.map(async (item) => {
        const customer = await this.prisma.customer.findUnique({
          where: { id: item.customerId },
          select: {
            id: true,
            name: true,
            segment: true,
          },
        });

        return {
          customer: customer || { id: item.customerId, name: 'Unknown', segment: 'UNKNOWN' },
          revenue: item._sum.costDetails || 0,
          jobCount: item._count.customerId,
        };
      })
    );

    return customerDetails
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  /**
   * Calculate customer retention
   */
  private async calculateCustomerRetention(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
    // This is a simplified calculation
    // In a real implementation, you would calculate based on customer activity over time periods
    
    const totalCustomers = await this.prisma.customer.count({
      where: { tenantId, isActive: true },
    });

    const customersWithJobs = await this.prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        jobs: {
          some: {},
        },
      },
    });

    return totalCustomers > 0 ? (customersWithJobs / totalCustomers) * 100 : 0;
  }
}
