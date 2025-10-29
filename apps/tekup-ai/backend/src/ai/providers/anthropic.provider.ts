import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { StreamService } from '../streaming/stream.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: Tool[];
}

@Injectable()
export class AnthropicProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic;
  private defaultModel: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(
    private configService: ConfigService,
    private streamService: StreamService,
  ) {
    const apiKey = this.configService.get<string>('app.anthropic.apiKey');

    if (!apiKey) {
      this.logger.error('Anthropic API key not configured');
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.defaultModel =
      this.configService.get<string>('app.anthropic.defaultModel') ||
      'claude-3-5-sonnet-20241022';
    this.defaultMaxTokens =
      this.configService.get<number>('app.anthropic.maxTokens') || 4096;
    this.defaultTemperature =
      this.configService.get<number>('app.anthropic.temperature') || 0.7;

    this.logger.log(`Anthropic provider initialized with model: ${this.defaultModel}`);
  }

  /**
   * Stream chat completion
   */
  async streamChat(
    messages: ChatMessage[],
    res: Response,
    options?: ChatOptions,
  ): Promise<void> {
    try {
      // Setup SSE headers
      this.streamService.setupSSEHeaders(res);

      // Send start event
      this.streamService.sendStart(res, {
        model: options?.model || this.defaultModel,
      });

      // Convert messages to Anthropic format
      const systemMessage = messages.find((m) => m.role === 'system');
      const conversationMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Prepare request parameters
      const requestParams: any = {
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature ?? this.defaultTemperature,
        messages: conversationMessages,
        stream: true,
      };

      // Add system prompt
      if (options?.systemPrompt || systemMessage) {
        requestParams.system = options?.systemPrompt || systemMessage.content;
      }

      // Add tools if provided
      if (options?.tools && options.tools.length > 0) {
        requestParams.tools = options.tools;
      }

      // Create stream
      const stream = await this.client.messages.create(requestParams);

      let fullResponse = '';
      let toolUses: any[] = [];

      // Process stream
      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'text') {
            // Text block started
            continue;
          } else if (event.content_block.type === 'tool_use') {
            // Tool use started
            const toolUse = event.content_block;
            toolUses.push({
              id: toolUse.id,
              name: toolUse.name,
              input: {},
            });
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            // Send text content
            const content = event.delta.text;
            fullResponse += content;
            this.streamService.sendContent(res, content);
          } else if (event.delta.type === 'input_json_delta') {
            // Accumulate tool input
            const lastTool = toolUses[toolUses.length - 1];
            if (lastTool) {
              lastTool.input = {
                ...lastTool.input,
                ...JSON.parse(event.delta.partial_json || '{}'),
              };
            }
          }
        } else if (event.type === 'content_block_stop') {
          // Content block completed
          if (toolUses.length > 0) {
            const toolUse = toolUses[toolUses.length - 1];
            this.streamService.sendToolUse(
              res,
              toolUse.name,
              toolUse.input,
              toolUse.id,
            );
          }
        } else if (event.type === 'message_stop') {
          // Message completed
          break;
        }
      }

      // Send end event
      this.streamService.sendEnd(res, {
        fullResponse,
        toolUses,
      });
    } catch (error) {
      this.logger.error('Stream chat error:', error);
      this.streamService.handleStreamError(res, error);
    }
  }

  /**
   * Non-streaming chat completion (for tool calls)
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<{
    content: string;
    toolCalls?: any[];
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
  }> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system');
      const conversationMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const requestParams: any = {
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature ?? this.defaultTemperature,
        messages: conversationMessages,
      };

      if (options?.systemPrompt || systemMessage) {
        requestParams.system = options?.systemPrompt || systemMessage.content;
      }

      if (options?.tools && options.tools.length > 0) {
        requestParams.tools = options.tools;
      }

      const response = await this.client.messages.create(requestParams);

      // Extract content and tool calls
      let content = '';
      const toolCalls: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }
}
