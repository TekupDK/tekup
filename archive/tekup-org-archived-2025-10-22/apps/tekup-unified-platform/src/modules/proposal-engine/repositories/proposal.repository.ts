import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/services/prisma.service';
import { ProposalStatus } from '../dto/proposal.dto';

/**
 * Proposal Repository
 * 
 * Handles database operations for proposals:
 * - CRUD operations for proposal records
 * - Multi-tenant data isolation
 * - Status tracking and updates
 * - Metadata storage and retrieval
 */
@Injectable()
export class ProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new proposal record
   */
  async create(data: {
    tenantId: string;
    transcriptId: string;
    status: ProposalStatus;
    options: any;
    documentUrl?: string;
    metadata?: any;
    errorMessage?: string;
  }) {
    return this.prisma.proposal.create({
      data: {
        tenantId: data.tenantId,
        transcriptId: data.transcriptId,
        status: data.status,
        options: data.options,
        documentUrl: data.documentUrl,
        metadata: data.metadata,
        errorMessage: data.errorMessage,
      },
    });
  }

  /**
   * Find proposal by ID and tenant
   */
  async findByTenantAndId(tenantId: string, proposalId: string) {
    return this.prisma.proposal.findFirst({
      where: {
        id: proposalId,
        tenantId: tenantId,
      },
    });
  }

  /**
   * Find proposals by tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    proposals: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where: {
          tenantId: tenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.proposal.count({
        where: {
          tenantId: tenantId,
        },
      }),
    ]);

    return {
      proposals,
      total,
      page,
      limit,
    };
  }

  /**
   * Update proposal record
   */
  async update(proposalId: string, data: {
    status?: ProposalStatus;
    documentUrl?: string;
    metadata?: any;
    errorMessage?: string;
  }) {
    return this.prisma.proposal.update({
      where: {
        id: proposalId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete proposal record
   */
  async delete(proposalId: string) {
    return this.prisma.proposal.delete({
      where: {
        id: proposalId,
      },
    });
  }

  /**
   * Find proposals by status
   */
  async findByStatus(tenantId: string, status: ProposalStatus) {
    return this.prisma.proposal.findMany({
      where: {
        tenantId: tenantId,
        status: status,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find proposals by transcript ID
   */
  async findByTranscriptId(tenantId: string, transcriptId: string) {
    return this.prisma.proposal.findMany({
      where: {
        tenantId: tenantId,
        transcriptId: transcriptId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get proposal statistics for tenant
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
    successRate: number;
    averageProcessingTime: number;
  }> {
    const [
      total,
      completed,
      processing,
      failed,
    ] = await Promise.all([
      this.prisma.proposal.count({
        where: { tenantId },
      }),
      this.prisma.proposal.count({
        where: { tenantId, status: ProposalStatus.COMPLETED },
      }),
      this.prisma.proposal.count({
        where: { tenantId, status: ProposalStatus.PROCESSING },
      }),
      this.prisma.proposal.count({
        where: { tenantId, status: ProposalStatus.FAILED },
      }),
    ]);

    const successRate = total > 0 ? completed / total : 0;

    // Calculate average processing time for completed proposals
    const completedProposals = await this.prisma.proposal.findMany({
      where: {
        tenantId,
        status: ProposalStatus.COMPLETED,
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const averageProcessingTime = completedProposals.length > 0
      ? completedProposals.reduce((sum, proposal) => {
          const processingTime = proposal.updatedAt.getTime() - proposal.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedProposals.length
      : 0;

    return {
      total,
      completed,
      processing,
      failed,
      successRate,
      averageProcessingTime,
    };
  }

  /**
   * Find recent proposals
   */
  async findRecent(tenantId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.proposal.findMany({
      where: {
        tenantId: tenantId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Search proposals by client name or content
   */
  async search(tenantId: string, query: string, limit: number = 20) {
    return this.prisma.proposal.findMany({
      where: {
        tenantId: tenantId,
        OR: [
          {
            options: {
              path: ['clientName'],
              string_contains: query,
            },
          },
          {
            metadata: {
              path: ['buyingSignals', 'summary', 'clientName'],
              string_contains: query,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}