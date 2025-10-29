import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateConversationDto {
  title?: string;
  metadata?: any;
}

export interface UpdateConversationDto {
  title?: string;
  archived?: boolean;
  metadata?: any;
}

export interface ConversationWithMessages {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  metadata: any;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
    tokens?: number;
    model?: string;
    toolCalls?: any;
    toolResults?: any;
  }>;
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new conversation
   */
  async create(userId: string, dto: CreateConversationDto) {
    try {
      const conversation = await this.prisma.aiConversation.create({
        data: {
          userId,
          title: dto.title || 'New Conversation',
          metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : {},
        },
      });

      this.logger.log(`Created conversation ${conversation.id} for user ${userId}`);

      return conversation;
    } catch (error) {
      this.logger.error('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async findAll(userId: string, includeArchived: boolean = false) {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: {
          userId,
          ...(includeArchived ? {} : { archived: false }),
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          messages: {
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Only get the last message for preview
          },
        },
      });

      return conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        archived: conv.archived,
        metadata: conv.metadata,
        lastMessage: conv.messages[0] || null,
        messageCount: conv.messages.length,
      }));
    } catch (error) {
      this.logger.error('Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Get a single conversation with all messages
   */
  async findOne(userId: string, conversationId: string): Promise<ConversationWithMessages> {
    try {
      const conversation = await this.prisma.aiConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
              tokens: true,
              model: true,
              toolCalls: true,
              toolResults: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return conversation as ConversationWithMessages;
    } catch (error) {
      this.logger.error(`Failed to get conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Update a conversation
   */
  async update(userId: string, conversationId: string, dto: UpdateConversationDto) {
    try {
      // Verify ownership
      const existing = await this.prisma.aiConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }

      const updated = await this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: {
          title: dto.title,
          archived: dto.archived,
          metadata: dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : undefined,
        },
      });

      this.logger.log(`Updated conversation ${conversationId}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async delete(userId: string, conversationId: string) {
    try {
      // Verify ownership
      const existing = await this.prisma.aiConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }

      // Delete conversation (messages will cascade)
      await this.prisma.aiConversation.delete({
        where: { id: conversationId },
      });

      this.logger.log(`Deleted conversation ${conversationId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  async archive(userId: string, conversationId: string) {
    return this.update(userId, conversationId, { archived: true });
  }

  /**
   * Unarchive a conversation
   */
  async unarchive(userId: string, conversationId: string) {
    return this.update(userId, conversationId, { archived: false });
  }

  /**
   * Get conversation statistics for a user
   */
  async getStats(userId: string) {
    try {
      const [total, active, archived, totalMessages] = await Promise.all([
        this.prisma.aiConversation.count({
          where: { userId },
        }),
        this.prisma.aiConversation.count({
          where: { userId, archived: false },
        }),
        this.prisma.aiConversation.count({
          where: { userId, archived: true },
        }),
        this.prisma.aiMessage.count({
          where: {
            conversation: {
              userId,
            },
          },
        }),
      ]);

      return {
        totalConversations: total,
        activeConversations: active,
        archivedConversations: archived,
        totalMessages,
      };
    } catch (error) {
      this.logger.error('Failed to get conversation stats:', error);
      throw error;
    }
  }

  /**
   * Search conversations by title or content
   */
  async search(userId: string, query: string) {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: {
          userId,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              messages: {
                some: {
                  content: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
        include: {
          messages: {
            where: {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
            take: 3,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 20,
      });

      return conversations;
    } catch (error) {
      this.logger.error('Failed to search conversations:', error);
      throw error;
    }
  }
}
