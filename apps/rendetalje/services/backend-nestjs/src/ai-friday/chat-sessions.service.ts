import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FridayMessage, FridayContext } from './ai-friday.service';

export interface ChatSession {
  id: string;
  userId: string;
  organizationId: string;
  context: string;
  title?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class ChatSessionsService {
  private readonly logger = new Logger(ChatSessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: string,
    organizationId: string,
    context: FridayContext,
    title?: string,
  ): Promise<ChatSession> {
    try {
      const session = await this.prisma.renosChatSession.create({
        data: {
          userId,
          organizationId,
          context: context.userRole,
          title: title || this.generateSessionTitle(context),
          metadata: {
            currentPage: context.currentPage,
            selectedJobId: context.selectedJobId,
            selectedCustomerId: context.selectedCustomerId,
            selectedTeamMemberId: context.selectedTeamMemberId,
            preferences: context.preferences,
          },
        },
      });

      this.logger.log(`Chat session created: ${session.id}`);
      return this.mapSessionToInterface(session);
    } catch (error) {
      this.logger.error('Failed to create chat session', error);
      throw new BadRequestException('Failed to create chat session');
    }
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession> {
    try {
      const session = await this.prisma.renosChatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new NotFoundException('Chat session not found');
      }

      return this.mapSessionToInterface(session);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to get chat session', error);
      throw new BadRequestException('Failed to get chat session');
    }
  }

  async getUserSessions(
    userId: string,
    organizationId: string,
    limit: number = 20,
  ): Promise<ChatSession[]> {
    try {
      const sessions = await this.prisma.renosChatSession.findMany({
        where: {
          userId,
          organizationId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return sessions.map(s => this.mapSessionToInterface(s));
    } catch (error) {
      this.logger.error('Failed to get user sessions', error);
      throw new BadRequestException('Failed to get user sessions');
    }
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: { title?: string; metadata?: Record<string, any> },
  ): Promise<ChatSession> {
    try {
      const session = await this.prisma.renosChatSession.update({
        where: {
          id: sessionId,
          userId,
        },
        data: updates,
      });

      return this.mapSessionToInterface(session);
    } catch (error) {
      this.logger.error('Failed to update chat session', error);
      throw new BadRequestException('Failed to update chat session');
    }
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      await this.prisma.renosChatSession.delete({
        where: {
          id: sessionId,
          userId,
        },
      });

      this.logger.log(`Chat session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to delete chat session', error);
      throw new BadRequestException('Failed to delete chat session');
    }
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<ChatMessage> {
    try {
      const message = await this.prisma.renosChatMessage.create({
        data: {
          sessionId,
          role,
          content,
          metadata,
        },
      });

      // Update session's updatedAt timestamp
      await this.prisma.renosChatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return this.mapMessageToInterface(message);
    } catch (error) {
      this.logger.error('Failed to add chat message', error);
      throw new BadRequestException('Failed to add chat message');
    }
  }

  async getSessionMessages(
    sessionId: string,
    userId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      // Verify user has access to this session
      await this.getSession(sessionId, userId);

      const messages = await this.prisma.renosChatMessage.findMany({
        where: {
          sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: limit,
      });

      return messages.map(m => this.mapMessageToInterface(m));
    } catch (error) {
      this.logger.error('Failed to get session messages', error);
      throw error;
    }
  }

  async getConversationHistory(
    sessionId: string,
    userId: string,
    limit: number = 10,
  ): Promise<FridayMessage[]> {
    const messages = await this.getSessionMessages(sessionId, userId, limit);
    
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      metadata: msg.metadata,
    }));
  }

  async searchSessions(
    userId: string,
    organizationId: string,
    query: string,
    limit: number = 10,
  ): Promise<ChatSession[]> {
    try {
      const sessions = await this.prisma.renosChatSession.findMany({
        where: {
          userId,
          organizationId,
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return sessions.map(s => this.mapSessionToInterface(s));
    } catch (error) {
      this.logger.error('Failed to search sessions', error);
      throw new BadRequestException('Failed to search sessions');
    }
  }

  async getSessionAnalytics(
    organizationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
    try {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      // Get session stats
      const sessions = await this.prisma.renosChatSession.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          context: true,
          createdAt: true,
        },
      });

      // Get message stats
      const messages = await this.prisma.renosChatMessage.findMany({
        where: {
          session: {
            organizationId,
          },
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
        },
      });

      // Calculate analytics
      const totalSessions = sessions.length;
      const totalMessages = messages.length;
      const userMessages = messages.filter(m => m.role === 'user').length;
      const assistantMessages = messages.filter(m => m.role === 'assistant').length;

      // Group by context (user role)
      const sessionsByContext = sessions.reduce((acc, session) => {
        acc[session.context] = (acc[session.context] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Daily usage
      const dailyUsage = sessions.reduce((acc, session) => {
        const date = session.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSessions,
        totalMessages,
        userMessages,
        assistantMessages,
        averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
        sessionsByContext,
        dailyUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get session analytics', error);
      throw new BadRequestException('Failed to get session analytics');
    }
  }

  private generateSessionTitle(context: FridayContext): string {
    const timestamp = new Date().toLocaleString('da-DK');
    
    if (context.currentPage) {
      return `Chat fra ${context.currentPage} - ${timestamp}`;
    }
    
    return `Friday Chat - ${timestamp}`;
  }

  private mapSessionToInterface(session: any): ChatSession {
    return {
      id: session.id,
      userId: session.userId,
      organizationId: session.organizationId,
      context: session.context,
      title: session.title,
      metadata: session.metadata as Record<string, any> || {},
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private mapMessageToInterface(message: any): ChatMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      metadata: message.metadata as Record<string, any> || {},
      createdAt: message.createdAt,
    };
  }
}
