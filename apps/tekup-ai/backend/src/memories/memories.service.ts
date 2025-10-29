import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface CreateMemoryDto {
  content: string;
  category?: 'preference' | 'fact' | 'instruction' | 'context' | 'general';
  priority?: number;
  expiresAt?: Date;
  source?: 'user_told' | 'system_inferred' | 'imported';
  metadata?: any;
}

export interface UpdateMemoryDto {
  content?: string;
  category?: 'preference' | 'fact' | 'instruction' | 'context' | 'general';
  priority?: number;
  expiresAt?: Date;
  isActive?: boolean;
  metadata?: any;
}

export interface MemoryFilters {
  category?: string;
  isActive?: boolean;
  minPriority?: number;
}

@Injectable()
export class MemoriesService {
  private readonly logger = new Logger(MemoriesService.name);
  private readonly maxMemoriesPerUser: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.maxMemoriesPerUser =
      this.configService.get<number>('app.memory.maxPerUser') || 50;
  }

  /**
   * Create a new memory
   */
  async create(userId: string, dto: CreateMemoryDto) {
    try {
      // Check if user has reached memory limit
      const userMemoryCount = await this.prisma.aiMemory.count({
        where: { userId, isActive: true },
      });

      if (userMemoryCount >= this.maxMemoriesPerUser) {
        // Archive oldest, lowest priority memory
        await this.archiveOldestLowPriorityMemory(userId);
      }

      const memory = await this.prisma.aiMemory.create({
        data: {
          userId,
          content: dto.content,
          category: dto.category || 'general',
          priority: dto.priority || 5,
          expiresAt: dto.expiresAt,
          source: dto.source || 'user_told',
          metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : {},
        },
      });

      this.logger.log(`Created memory ${memory.id} for user ${userId}`);

      return memory;
    } catch (error) {
      this.logger.error('Failed to create memory:', error);
      throw error;
    }
  }

  /**
   * Get all memories for a user
   */
  async findAll(userId: string, filters?: MemoryFilters) {
    try {
      const where: any = {
        userId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.minPriority && { priority: { gte: filters.minPriority } }),
      };

      const memories = await this.prisma.aiMemory.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      return memories;
    } catch (error) {
      this.logger.error('Failed to get memories:', error);
      throw error;
    }
  }

  /**
   * Get active memories for AI context
   */
  async getActiveForContext(userId: string, limit: number = 25) {
    try {
      const now = new Date();

      const memories = await this.prisma.aiMemory.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          content: true,
          category: true,
          priority: true,
          createdAt: true,
        },
      });

      return memories;
    } catch (error) {
      this.logger.error('Failed to get active memories:', error);
      throw error;
    }
  }

  /**
   * Get a specific memory
   */
  async findOne(userId: string, memoryId: string) {
    try {
      const memory = await this.prisma.aiMemory.findFirst({
        where: {
          id: memoryId,
          userId,
        },
      });

      if (!memory) {
        throw new NotFoundException('Memory not found');
      }

      return memory;
    } catch (error) {
      this.logger.error(`Failed to get memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Update a memory
   */
  async update(userId: string, memoryId: string, dto: UpdateMemoryDto) {
    try {
      // Verify ownership
      const existing = await this.prisma.aiMemory.findFirst({
        where: {
          id: memoryId,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Memory not found');
      }

      const updated = await this.prisma.aiMemory.update({
        where: { id: memoryId },
        data: {
          content: dto.content,
          category: dto.category,
          priority: dto.priority,
          expiresAt: dto.expiresAt,
          isActive: dto.isActive,
          metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
        },
      });

      this.logger.log(`Updated memory ${memoryId}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a memory
   */
  async delete(userId: string, memoryId: string) {
    try {
      // Verify ownership
      const existing = await this.prisma.aiMemory.findFirst({
        where: {
          id: memoryId,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Memory not found');
      }

      await this.prisma.aiMemory.delete({
        where: { id: memoryId },
      });

      this.logger.log(`Deleted memory ${memoryId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Archive (deactivate) a memory
   */
  async archive(userId: string, memoryId: string) {
    return this.update(userId, memoryId, { isActive: false });
  }

  /**
   * Restore (activate) a memory
   */
  async restore(userId: string, memoryId: string) {
    return this.update(userId, memoryId, { isActive: true });
  }

  /**
   * Get memory statistics for a user
   */
  async getStats(userId: string) {
    try {
      const [total, active, byCategory] = await Promise.all([
        this.prisma.aiMemory.count({
          where: { userId },
        }),
        this.prisma.aiMemory.count({
          where: { userId, isActive: true },
        }),
        this.prisma.aiMemory.groupBy({
          by: ['category'],
          where: { userId, isActive: true },
          _count: true,
        }),
      ]);

      const categoryCounts = byCategory.reduce(
        (acc, item) => {
          acc[item.category] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalMemories: total,
        activeMemories: active,
        inactiveMemories: total - active,
        byCategory: categoryCounts,
        limit: this.maxMemoriesPerUser,
      };
    } catch (error) {
      this.logger.error('Failed to get memory stats:', error);
      throw error;
    }
  }

  /**
   * Search memories by content
   */
  async search(userId: string, query: string) {
    try {
      const memories = await this.prisma.aiMemory.findMany({
        where: {
          userId,
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 20,
      });

      return memories;
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw error;
    }
  }

  /**
   * Bulk import memories
   */
  async bulkImport(userId: string, memories: CreateMemoryDto[]) {
    try {
      const created = await this.prisma.aiMemory.createMany({
        data: memories.map((memory) => ({
          userId,
          content: memory.content,
          category: memory.category || 'general',
          priority: memory.priority || 5,
          expiresAt: memory.expiresAt,
          source: 'imported',
          metadata: memory.metadata ? JSON.parse(JSON.stringify(memory.metadata)) : {},
        })),
      });

      this.logger.log(`Imported ${created.count} memories for user ${userId}`);

      return { count: created.count };
    } catch (error) {
      this.logger.error('Failed to bulk import memories:', error);
      throw error;
    }
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpired() {
    try {
      const now = new Date();

      const result = await this.prisma.aiMemory.updateMany({
        where: {
          expiresAt: { lt: now },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      this.logger.log(`Deactivated ${result.count} expired memories`);

      return { deactivated: result.count };
    } catch (error) {
      this.logger.error('Failed to cleanup expired memories:', error);
      throw error;
    }
  }

  /**
   * Archive oldest, lowest priority memory when limit is reached
   */
  private async archiveOldestLowPriorityMemory(userId: string) {
    const oldestMemory = await this.prisma.aiMemory.findFirst({
      where: { userId, isActive: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    if (oldestMemory) {
      await this.prisma.aiMemory.update({
        where: { id: oldestMemory.id },
        data: { isActive: false },
      });

      this.logger.log(
        `Archived memory ${oldestMemory.id} to make room for new memory`,
      );
    }
  }
}
