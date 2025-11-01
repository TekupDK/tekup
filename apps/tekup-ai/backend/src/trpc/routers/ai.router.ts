/**
 * AI Router (tRPC)
 * 
 * AI chat procedures that wrap the existing AiService.
 * This allows the mobile app to use the same AI functionality as the web app.
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.instance';
import { AiService, SendMessageDto } from '../../ai/ai.service';

const sendMessageInput = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
  systemPrompt: z.string().optional(),
});

export const aiRouter = router({
  /**
   * Send message to AI (non-streaming)
   * Wraps AiService.sendMessage()
   */
  chat: protectedProcedure
    .input(sendMessageInput)
    .mutation(async ({ ctx, input }) => {
      // Get AiService from context (injected by TrpcService)
      const aiService = ctx.aiService;

      if (!aiService) {
        throw new Error('AI service not available');
      }

      if (!ctx.userId) {
        throw new Error('User ID not found in context');
      }

      const dto: SendMessageDto = {
        conversationId: input.conversationId,
        message: input.message,
        model: input.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        systemPrompt: input.systemPrompt,
      };

      const result = await aiService.sendMessage(ctx.userId, dto);

      return {
        conversationId: result.conversationId,
        messageId: result.messageId,
        content: result.content,
        model: result.model,
        tokens: result.tokens,
      };
    }),

  /**
   * Get available AI models
   */
  getModels: protectedProcedure.query(async () => {
    return {
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
        },
      ],
      default: 'claude-3-5-sonnet-20241022',
    };
  }),
});
