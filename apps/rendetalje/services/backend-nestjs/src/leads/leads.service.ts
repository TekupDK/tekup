import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Lead, LeadStatus, LeadPriority } from './entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto, LeadFiltersDto } from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: LeadFiltersDto): Promise<PaginatedResponseDto<Lead>> {
    const { 
      status, 
      priority, 
      source, 
      minEstimatedValue, 
      minScore, 
      email, 
      phone,
      search,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;
    if (email) where.email = email;
    if (phone) where.phone = phone;

    if (minEstimatedValue !== undefined) {
      where.estimatedValue = { gte: minEstimatedValue };
    }

    if (minScore !== undefined) {
      where.score = { gte: minScore };
    }

    // Search across name, email, phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.renosLead.count({ where });

    // Get paginated results
    const skip = (page - 1) * limit;
    const leads = await this.prisma.renosLead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: leads as Lead[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.prisma.renosLead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead as Lead;
  }

  async create(data: CreateLeadDto): Promise<Lead> {
    const lead = await this.prisma.renosLead.create({
      data: {
        ...data,
        status: LeadStatus.NEW,
        score: 0,
        priority: LeadPriority.MEDIUM,
        followUpAttempts: 0,
        preferredDates: data.preferredDates || [],
      },
    });

    return lead as Lead;
  }

  async update(id: string, data: UpdateLeadDto): Promise<Lead> {
    // Check if lead exists
    await this.findOne(id);

    const lead = await this.prisma.renosLead.update({
      where: { id },
      data,
    });

    return lead as Lead;
  }

  async remove(id: string): Promise<void> {
    // Check if lead exists
    await this.findOne(id);

    await this.prisma.renosLead.delete({
      where: { id },
    });
  }

  async enrichLead(id: string, enrichmentData: {
    companyName?: string;
    industry?: string;
    estimatedSize?: string;
    estimatedValue?: number;
    enrichmentData?: Record<string, any>;
  }): Promise<Lead> {
    const lead = await this.prisma.renosLead.update({
      where: { id },
      data: {
        ...enrichmentData,
        lastEnriched: new Date(),
      },
    });

    return lead as Lead;
  }

  async scoreLead(id: string, score: number, priority: LeadPriority, metadata?: Record<string, any>): Promise<Lead> {
    const lead = await this.prisma.renosLead.update({
      where: { id },
      data: {
        score,
        priority,
        lastScored: new Date(),
        scoreMetadata: metadata || undefined,
      },
    });

    return lead as Lead;
  }

  async incrementFollowUpAttempts(id: string): Promise<Lead> {
    const lead = await this.prisma.renosLead.update({
      where: { id },
      data: {
        followUpAttempts: { increment: 1 },
        lastFollowUpDate: new Date(),
      },
    });

    return lead as Lead;
  }
}
