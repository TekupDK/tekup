import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
import { PaginationUtil } from '../utils/pagination.util';

@Injectable()
export abstract class BaseService<T> {
  protected abstract modelName: string;
  protected abstract searchFields: string[];

  constructor(protected readonly prismaService: PrismaService) {}

  async findAll(
    organizationId: string,
    pagination: PaginationDto,
    filters?: Record<string, any>,
  ): Promise<PaginatedResponseDto<T>> {
    const { page = 1, limit = 10, search } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organization_id: organizationId,
      ...filters,
    };

    // Add search functionality
    if (search && this.searchFields.length > 0) {
      where.OR = this.searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      }));
    }

    // Get model accessor
    const model = this.getModel();

    // Execute queries
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      model.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(data as T[], total, pagination);
  }

  async findById(id: string, organizationId: string): Promise<T> {
    const model = this.getModel();
    
    const data = await model.findFirst({
      where: {
        id,
        organization_id: organizationId,
      },
    });

    if (!data) {
      throw new NotFoundException(`${this.modelName} with ID ${id} not found`);
    }

    return data as T;
  }

  async create(createDto: Partial<T>, organizationId: string): Promise<T> {
    const model = this.getModel();

    try {
      const data = await model.create({
        data: {
          ...createDto,
          organization_id: organizationId,
        },
      });

      return data as T;
    } catch (error) {
      throw new BadRequestException(`Failed to create ${this.modelName}: ${error.message}`);
    }
  }

  async update(id: string, updateDto: Partial<T>, organizationId: string): Promise<T> {
    // First check if record exists and belongs to organization
    await this.findById(id, organizationId);

    const model = this.getModel();

    try {
      const data = await model.update({
        where: {
          id,
          organization_id: organizationId,
        },
        data: updateDto,
      });

      return data as T;
    } catch (error) {
      throw new BadRequestException(`Failed to update ${this.modelName}: ${error.message}`);
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    // First check if record exists and belongs to organization
    await this.findById(id, organizationId);

    const model = this.getModel();

    try {
      await model.delete({
        where: {
          id,
          organization_id: organizationId,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete ${this.modelName}: ${error.message}`);
    }
  }

  async count(organizationId: string, filters?: Record<string, any>): Promise<number> {
    const model = this.getModel();

    return model.count({
      where: {
        organization_id: organizationId,
        ...filters,
      },
    });
  }

  protected getModel() {
    // Map model names to Prisma client accessors
    const modelMap: Record<string, any> = {
      customers: this.prismaService.customers,
      jobs: this.prismaService.jobs,
      job_assignments: this.prismaService.jobAssignments,
      team_members: this.prismaService.teamMembers,
      users: this.prismaService.users,
      organizations: this.prismaService.organizations,
      customer_messages: this.prismaService.customerMessages,
      customer_reviews: this.prismaService.customerReviews,
      time_entries: this.prismaService.timeEntries,
      chat_sessions: this.prismaService.chatSessions,
      chat_messages: this.prismaService.chatMessages,
    };

    const model = modelMap[this.modelName];
    if (!model) {
      throw new Error(`Model ${this.modelName} not found in Prisma client`);
    }

    return model;
  }
}