import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AnthropicProvider, ChatMessage, ChatOptions } from './providers/anthropic.provider';
import { StreamService } from './streaming/stream.service';

export interface SendMessageDto {
  conversationId?: string;
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  model: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private anthropicProvider: AnthropicProvider,
    private streamService: StreamService,
  ) {}

  /**
   * Stream AI chat response
   */
  async streamMessage(
    userId: string,
    dto: SendMessageDto,
    res: Response,
  ): Promise<void> {
    try {
      // Get or create conversation
      const conversation = dto.conversationId
        ? await this.getConversation(userId, dto.conversationId)
        : await this.createConversation(userId);

      // Save user message
      const userMessage = await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: dto.message,
        },
      });

      // Get conversation history
      const history = await this.getConversationHistory(conversation.id);

      // Get user settings for system prompt and preferences
      const userSettings = await this.prisma.aiUserSettings.findUnique({
        where: { userId },
      });

      // Get user memories
      const memories = await this.getUserMemories(userId);

      // Build messages array
      const messages: ChatMessage[] = [];

      // Add system prompt with memories
      const systemPrompt = this.buildSystemPrompt(
        dto.systemPrompt || userSettings?.systemPrompt || undefined,
        memories,
      );
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      // Add conversation history
      messages.push(...history);

      // Add current message
      messages.push({
        role: 'user',
        content: dto.message,
      });

      // Prepare chat options
      const options: ChatOptions = {
        model: dto.model || userSettings?.defaultModel,
        maxTokens: dto.maxTokens || userSettings?.maxTokens,
        temperature: dto.temperature ?? userSettings?.temperature,
      };

      // Stream response
      await this.anthropicProvider.streamChat(messages, res, options);

      // Note: We'll save the assistant message in a callback or separate endpoint
      // since streaming completes asynchronously
    } catch (error) {
      this.logger.error('Stream message error:', error);
      this.streamService.handleStreamError(res, error);
    }
  }

  /**
   * Send message without streaming (for API integrations)
   */
  async sendMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<ChatResponse> {
    try {
      // Get or create conversation
      const conversation = dto.conversationId
        ? await this.getConversation(userId, dto.conversationId)
        : await this.createConversation(userId);

      // Save user message
      await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: dto.message,
        },
      });

      // Get conversation history
      const history = await this.getConversationHistory(conversation.id);

      // Get user settings
      const userSettings = await this.prisma.aiUserSettings.findUnique({
        where: { userId },
      });

      // Get user memories
      const memories = await this.getUserMemories(userId);

      // Build messages
      const messages: ChatMessage[] = [];

      const systemPrompt = this.buildSystemPrompt(
        dto.systemPrompt || userSettings?.systemPrompt || undefined,
        memories,
      );
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push(...history);
      messages.push({
        role: 'user',
        content: dto.message,
      });

      // Get response
      const options: ChatOptions = {
        model: dto.model || userSettings?.defaultModel,
        maxTokens: dto.maxTokens || userSettings?.maxTokens,
        temperature: dto.temperature ?? userSettings?.temperature,
      };

      const response = await this.anthropicProvider.chat(messages, options);

      // Save assistant message
      const assistantMessage = await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: response.content,
          model: options.model,
          tokens: response.usage
            ? response.usage.inputTokens + response.usage.outputTokens
            : undefined,
          toolCalls: response.toolCalls
            ? JSON.parse(JSON.stringify(response.toolCalls))
            : undefined,
        },
      });

      // Update usage stats
      if (response.usage) {
        await this.updateUsageStats(
          userId,
          response.usage.inputTokens + response.usage.outputTokens,
        );
      }

      // Update conversation
      await this.prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return {
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        content: response.content,
        model: options.model || 'unknown',
        tokens: response.usage
          ? {
              input: response.usage.inputTokens,
              output: response.usage.outputTokens,
              total:
                response.usage.inputTokens + response.usage.outputTokens,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt with memories
   */
  private buildSystemPrompt(
    customPrompt?: string,
    memories?: any[],
  ): string {
    let prompt = customPrompt || 'You are a helpful AI assistant.';

    if (memories && memories.length > 0) {
      prompt += '\n\nUser Context and Memories:\n';
      memories.forEach((memory) => {
        prompt += `- ${memory.content}\n`;
      });
    }

    return prompt;
  }

  /**
   * Get conversation
   */
  private async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Create new conversation
   */
  private async createConversation(userId: string) {
    return this.prisma.aiConversation.create({
      data: {
        userId,
        title: 'New Conversation',
      },
    });
  }

  /**
   * Get conversation history
   */
  private async getConversationHistory(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
      },
    });

    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  /**
   * Get user memories
   */
  private async getUserMemories(userId: string) {
    return this.prisma.aiMemory.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
      take: 25,
      select: {
        content: true,
        category: true,
      },
    });
  }

  /**
   * Update usage statistics
   */
  private async updateUsageStats(userId: string, tokens: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.aiUsageStats.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        messagesCount: { increment: 1 },
        tokensUsed: { increment: tokens },
      },
      create: {
        userId,
        date: today,
        messagesCount: 1,
        tokensUsed: tokens,
      },
    });
  }
}
