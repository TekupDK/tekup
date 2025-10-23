import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BaseService } from '../common/services/base.service';
import { PrismaService } from '../database/prisma.service';
import { Customer } from './entities/customer.entity';
import { CustomerMessage } from './entities/customer-message.entity';
import { CustomerReview } from './entities/customer-review.entity';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CreateMessageDto, 
  CreateReviewDto, 
  CustomerFiltersDto 
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class CustomersService extends BaseService<Customer> {
  protected modelName = 'customers';
  protected searchFields = ['name', 'email', 'phone'];

  constructor(protected readonly prismaService: PrismaService) {
    super(prismaService);
  }

  async findAllWithFilters(
    organizationId: string,
    filters: CustomerFiltersDto,
  ): Promise<PaginatedResponseDto<Customer>> {
    const { 
      city, 
      is_active, 
      min_satisfaction, 
      min_jobs, 
      min_revenue,
      search,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organization_id: organizationId,
    };

    // Apply filters
    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // City filter (JSON field)
    if (city) {
      where.address = {
        path: ['city'],
        string_contains: city,
      };
    }

    // Satisfaction score filter
    if (min_satisfaction !== undefined) {
      where.satisfaction_score = {
        gte: min_satisfaction,
      };
    }

    // Jobs count filter
    if (min_jobs !== undefined) {
      where.total_jobs = {
        gte: min_jobs,
      };
    }

    // Revenue filter
    if (min_revenue !== undefined) {
      where.total_revenue = {
        gte: min_revenue,
      };
    }

    // Search filter
    if (search) {
      where.OR = this.searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      }));
    }

    try {
      // Execute queries
      const [data, total] = await Promise.all([
        this.prismaService.customers.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prismaService.customers.count({ where }),
      ]);

      return PaginationUtil.createPaginatedResponse(data as Customer[], total, filters);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch customers: ${error.message}`);
    }
  }

  async create(createCustomerDto: CreateCustomerDto, organizationId: string): Promise<Customer> {
    // Check for duplicate email if provided
    if (createCustomerDto.email) {
      await this.checkDuplicateEmail(createCustomerDto.email, organizationId);
    }

    const customerData = {
      ...createCustomerDto,
      organization_id: organizationId,
      preferences: createCustomerDto.preferences || {},
      total_jobs: 0,
      total_revenue: 0,
      is_active: true,
    };

    try {
      const data = await this.prismaService.customers.create({
        data: customerData,
      });

      return data as Customer;
    } catch (error) {
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  async getCustomerHistory(id: string, organizationId: string): Promise<any> {
    // Verify customer exists and belongs to organization
    await this.findById(id, organizationId);

    try {
      // Get customer's job history
      const jobs = await this.prismaService.jobs.findMany({
        where: {
          customer_id: id,
        },
        select: {
          id: true,
          job_number: true,
          service_type: true,
          status: true,
          scheduled_date: true,
          actual_duration: true,
          quality_score: true,
          profitability: true,
        },
        orderBy: {
          scheduled_date: 'desc',
        },
      });

      // Get customer's reviews
      const reviews = await this.prismaService.customerReviews.findMany({
        where: {
          customer_id: id,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate statistics
      const completedJobs = jobs.filter(job => job.status === 'completed');
      const totalRevenue = completedJobs.reduce((sum, job) => {
        return sum + ((job.profitability as any)?.total_price || 0);
      }, 0);

      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review as any).rating, 0) / reviews.length
        : null;

      return {
        jobs,
        reviews,
        statistics: {
          total_jobs: jobs.length,
          completed_jobs: completedJobs.length,
          total_revenue: totalRevenue,
          average_rating: averageRating,
          last_job_date: jobs.length > 0 ? jobs[0].scheduled_date : null,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch customer history: ${error.message}`);
    }
  }

  async getCustomerMessages(
    customerId: string, 
    organizationId: string,
    jobId?: string
  ): Promise<CustomerMessage[]> {
    // Verify customer exists and belongs to organization
    await this.findById(customerId, organizationId);

    try {
      const where: any = {
        customer_id: customerId,
        organization_id: organizationId,
      };

      if (jobId) {
        where.job_id = jobId;
      }

      const messages = await this.prismaService.customerMessages.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return messages as CustomerMessage[];
    } catch (error) {
      throw new BadRequestException(`Failed to fetch customer messages: ${error.message}`);
    }
  }

  async createMessage(
    createMessageDto: CreateMessageDto, 
    organizationId: string,
    senderId?: string
  ): Promise<CustomerMessage> {
    // Verify customer exists and belongs to organization
    await this.findById(createMessageDto.customer_id, organizationId);

    // Verify job exists if provided
    if (createMessageDto.job_id) {
      await this.validateJob(createMessageDto.job_id, organizationId);
    }

    const messageData = {
      ...createMessageDto,
      organization_id: organizationId,
      sender_id: senderId,
      attachments: createMessageDto.attachments || [],
      is_read: false,
    };

    try {
      const data = await this.prismaService.customerMessages.create({
        data: messageData,
      });

      return data as CustomerMessage;
    } catch (error) {
      throw new BadRequestException(`Failed to create message: ${error.message}`);
    }
  }

  async markMessageAsRead(messageId: string, organizationId: string): Promise<void> {
    try {
      await this.prismaService.customerMessages.update({
        where: {
          id: messageId,
          organization_id: organizationId,
        },
        data: {
          is_read: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to mark message as read: ${error.message}`);
    }
  }

  async getCustomerReviews(
    customerId: string, 
    organizationId: string
  ): Promise<CustomerReview[]> {
    // Verify customer exists and belongs to organization
    await this.findById(customerId, organizationId);

    try {
      const reviews = await this.prismaService.customerReviews.findMany({
        where: {
          customer_id: customerId,
        },
        include: {
          jobs: {
            select: {
              id: true,
              job_number: true,
              service_type: true,
              scheduled_date: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return reviews as CustomerReview[];
    } catch (error) {
      throw new BadRequestException(`Failed to fetch customer reviews: ${error.message}`);
    }
  }

  async createReview(
    createReviewDto: CreateReviewDto, 
    customerId: string,
    organizationId: string
  ): Promise<CustomerReview> {
    // Verify customer exists and belongs to organization
    await this.findById(customerId, organizationId);

    // Verify job exists and belongs to customer
    await this.validateJobBelongsToCustomer(createReviewDto.job_id, customerId, organizationId);

    try {
      // Check if review already exists for this job
      const existingReview = await this.prismaService.customerReviews.findFirst({
        where: {
          job_id: createReviewDto.job_id,
          customer_id: customerId,
        },
        select: { id: true },
      });

      if (existingReview) {
        throw new BadRequestException('Review already exists for this job');
      }

      const reviewData = {
        ...createReviewDto,
        customer_id: customerId,
        photos: createReviewDto.photos || [],
      };

      const data = await this.prismaService.customerReviews.create({
        data: reviewData,
      });

      // Update customer satisfaction score
      await this.updateCustomerSatisfactionScore(customerId);

      return data as CustomerReview;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create review: ${error.message}`);
    }
  }

  async getCustomerAnalytics(organizationId: string, timeRange: string = '30d'): Promise<any> {
    try {
      // Get basic customer metrics
      const totalCustomers = await this.prismaService.customers.count({
        where: { organization_id: organizationId },
      });

      const activeCustomers = await this.prismaService.customers.count({
        where: { 
          organization_id: organizationId,
          is_active: true,
        },
      });

      // Calculate date range for new customers
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const newCustomersThisMonth = await this.prismaService.customers.count({
        where: {
          organization_id: organizationId,
          created_at: {
            gte: startDate,
          },
        },
      });

      return {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        averageSatisfaction: 0, // TODO: Implement when reviews are working
        totalRevenue: 0, // TODO: Calculate from customer data
        averageJobsPerCustomer: 0, // TODO: Calculate from job data
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch customer analytics: ${error.message}`);
    }
  }

  async getCustomerSatisfactionMetrics(organizationId: string): Promise<any> {
    try {
      // Simplified satisfaction metrics for now
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        monthly_trends: {},
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch satisfaction metrics: ${error.message}`);
    }
  }

  async deactivateCustomer(id: string, organizationId: string): Promise<Customer> {
    return this.update(id, { is_active: false } as any, organizationId);
  }

  async activateCustomer(id: string, organizationId: string): Promise<Customer> {
    return this.update(id, { is_active: true } as any, organizationId);
  }

  private async checkDuplicateEmail(email: string, organizationId: string, excludeId?: string): Promise<void> {
    try {
      const where: any = {
        email,
        organization_id: organizationId,
      };

      if (excludeId) {
        where.NOT = {
          id: excludeId,
        };
      }

      const existingCustomer = await this.prismaService.customers.findFirst({
        where,
        select: { id: true },
      });

      if (existingCustomer) {
        throw new BadRequestException('Customer with this email already exists');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to check duplicate email: ${error.message}`);
    }
  }

  private async validateJob(jobId: string, organizationId: string): Promise<void> {
    try {
      const job = await this.prismaService.jobs.findFirst({
        where: {
          id: jobId,
          organization_id: organizationId,
        },
        select: { id: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to validate job: ${error.message}`);
    }
  }

  private async validateJobBelongsToCustomer(
    jobId: string, 
    customerId: string, 
    organizationId: string
  ): Promise<void> {
    try {
      const job = await this.prismaService.jobs.findFirst({
        where: {
          id: jobId,
          customer_id: customerId,
          organization_id: organizationId,
        },
        select: { id: true },
      });

      if (!job) {
        throw new ForbiddenException('Job does not belong to this customer');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to validate job ownership: ${error.message}`);
    }
  }

  private async updateCustomerSatisfactionScore(customerId: string): Promise<void> {
    try {
      // Get all reviews for this customer
      const reviews = await this.prismaService.customerReviews.findMany({
        where: {
          customer_id: customerId,
        },
        select: {
          rating: true,
        },
      });

      if (reviews.length === 0) {
        return;
      }

      // Calculate average rating
      const averageRating = reviews.reduce((sum, review) => sum + (review as any).rating, 0) / reviews.length;

      // Update customer satisfaction score
      await this.prismaService.customers.update({
        where: {
          id: customerId,
        },
        data: {
          satisfaction_score: Math.round(averageRating * 100) / 100,
        },
      });
    } catch (error) {
      // Log error but don't throw - this is a background operation
      console.error('Failed to update customer satisfaction score:', error);
    }
  }
}