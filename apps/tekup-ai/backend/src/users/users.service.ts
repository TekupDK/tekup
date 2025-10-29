import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface UpdateUserSettingsDto {
  defaultModel?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableMemory?: boolean;
  maxMemories?: number;
  enabledMcpServers?: string[];
  uiPreferences?: any;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    try {
      const user = await this.prisma.aiUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to get user profile ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    try {
      const user = await this.prisma.aiUser.update({
        where: { id: userId },
        data: {
          name: dto.name,
          email: dto.email,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Updated user profile ${userId}`);

      return user;
    } catch (error) {
      this.logger.error(`Failed to update user profile ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getSettings(userId: string) {
    try {
      let settings = await this.prisma.aiUserSettings.findUnique({
        where: { userId },
      });

      // Create default settings if they don't exist
      if (!settings) {
        settings = await this.prisma.aiUserSettings.create({
          data: { userId },
        });
      }

      return settings;
    } catch (error) {
      this.logger.error(`Failed to get user settings ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    try {
      const settings = await this.prisma.aiUserSettings.upsert({
        where: { userId },
        update: {
          defaultModel: dto.defaultModel,
          systemPrompt: dto.systemPrompt,
          temperature: dto.temperature,
          maxTokens: dto.maxTokens,
          enableMemory: dto.enableMemory,
          maxMemories: dto.maxMemories,
          enabledMcpServers: dto.enabledMcpServers
            ? JSON.parse(JSON.stringify(dto.enabledMcpServers))
            : undefined,
          uiPreferences: dto.uiPreferences
            ? JSON.parse(JSON.stringify(dto.uiPreferences))
            : undefined,
        },
        create: {
          userId,
          defaultModel: dto.defaultModel || 'claude-3-5-sonnet-20241022',
          systemPrompt: dto.systemPrompt,
          temperature: dto.temperature ?? 0.7,
          maxTokens: dto.maxTokens ?? 4096,
          enableMemory: dto.enableMemory ?? true,
          maxMemories: dto.maxMemories ?? 25,
          enabledMcpServers: dto.enabledMcpServers
            ? JSON.parse(JSON.stringify(dto.enabledMcpServers))
            : [],
          uiPreferences: dto.uiPreferences
            ? JSON.parse(JSON.stringify(dto.uiPreferences))
            : {},
        },
      });

      this.logger.log(`Updated user settings ${userId}`);

      return settings;
    } catch (error) {
      this.logger.error(`Failed to update user settings ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user usage statistics
   */
  async getUsageStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const stats = await this.prisma.aiUsageStats.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Calculate totals
      const totals = stats.reduce(
        (acc, stat) => {
          acc.messages += stat.messagesCount;
          acc.tokens += stat.tokensUsed;
          acc.toolCalls += stat.toolCallsCount;
          acc.cost += stat.cost;
          return acc;
        },
        { messages: 0, tokens: 0, toolCalls: 0, cost: 0 },
      );

      return {
        period: {
          startDate,
          endDate: new Date(),
          days,
        },
        totals,
        daily: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get usage stats ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user dashboard summary
   */
  async getDashboard(userId: string) {
    try {
      const [
        profile,
        settings,
        conversationStats,
        memoryStats,
        usageStats,
      ] = await Promise.all([
        this.getProfile(userId),
        this.getSettings(userId),
        this.getConversationStats(userId),
        this.getMemoryStats(userId),
        this.getUsageStats(userId, 7), // Last 7 days
      ]);

      return {
        user: profile,
        settings,
        stats: {
          conversations: conversationStats,
          memories: memoryStats,
          usage: usageStats,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  private async getConversationStats(userId: string) {
    const [total, active, archived] = await Promise.all([
      this.prisma.aiConversation.count({
        where: { userId },
      }),
      this.prisma.aiConversation.count({
        where: { userId, archived: false },
      }),
      this.prisma.aiConversation.count({
        where: { userId, archived: true },
      }),
    ]);

    return { total, active, archived };
  }

  /**
   * Get memory statistics
   */
  private async getMemoryStats(userId: string) {
    const [total, active] = await Promise.all([
      this.prisma.aiMemory.count({
        where: { userId },
      }),
      this.prisma.aiMemory.count({
        where: { userId, isActive: true },
      }),
    ]);

    return { total, active, inactive: total - active };
  }

  /**
   * Delete user account (and all associated data)
   */
  async deleteAccount(userId: string) {
    try {
      // Delete user (will cascade to all related data)
      await this.prisma.aiUser.delete({
        where: { id: userId },
      });

      this.logger.log(`Deleted user account ${userId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete user account ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportData(userId: string) {
    try {
      const [
        user,
        settings,
        conversations,
        memories,
        integrations,
        usageStats,
      ] = await Promise.all([
        this.prisma.aiUser.findUnique({
          where: { id: userId },
        }),
        this.prisma.aiUserSettings.findUnique({
          where: { userId },
        }),
        this.prisma.aiConversation.findMany({
          where: { userId },
          include: {
            messages: true,
          },
        }),
        this.prisma.aiMemory.findMany({
          where: { userId },
        }),
        this.prisma.aiIntegration.findMany({
          where: { userId },
        }),
        this.prisma.aiUsageStats.findMany({
          where: { userId },
        }),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user,
        settings,
        conversations,
        memories,
        integrations,
        usageStats,
      };

      this.logger.log(`Exported data for user ${userId}`);

      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export data for user ${userId}:`, error);
      throw error;
    }
  }
}
