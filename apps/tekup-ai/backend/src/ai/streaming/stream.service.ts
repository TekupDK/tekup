import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';

export interface StreamChunk {
  type: 'start' | 'content' | 'tool_use' | 'error' | 'end';
  content?: string;
  toolName?: string;
  toolInput?: any;
  toolCallId?: string;
  error?: string;
  metadata?: any;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  /**
   * Setup SSE headers for streaming response
   */
  setupSSEHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();
  }

  /**
   * Send a chunk to the client
   */
  sendChunk(res: Response, chunk: StreamChunk): void {
    try {
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      this.logger.error('Error sending chunk:', error);
    }
  }

  /**
   * Send start event
   */
  sendStart(res: Response, metadata?: any): void {
    this.sendChunk(res, {
      type: 'start',
      metadata,
    });
  }

  /**
   * Send content chunk
   */
  sendContent(res: Response, content: string): void {
    this.sendChunk(res, {
      type: 'content',
      content,
    });
  }

  /**
   * Send tool use event
   */
  sendToolUse(
    res: Response,
    toolName: string,
    toolInput: any,
    toolCallId: string,
  ): void {
    this.sendChunk(res, {
      type: 'tool_use',
      toolName,
      toolInput,
      toolCallId,
    });
  }

  /**
   * Send error event
   */
  sendError(res: Response, error: string): void {
    this.sendChunk(res, {
      type: 'error',
      error,
    });
  }

  /**
   * Send end event and close stream
   */
  sendEnd(res: Response, metadata?: any): void {
    this.sendChunk(res, {
      type: 'end',
      metadata,
    });
    res.end();
  }

  /**
   * Handle stream errors
   */
  handleStreamError(res: Response, error: any): void {
    this.logger.error('Stream error:', error);

    if (!res.headersSent) {
      this.setupSSEHeaders(res);
    }

    this.sendError(res, error.message || 'An error occurred during streaming');
    this.sendEnd(res);
  }

  /**
   * Create a heartbeat to keep connection alive
   */
  createHeartbeat(res: Response, intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      res.write(': heartbeat\n\n');
    }, intervalMs);
  }

  /**
   * Clear heartbeat
   */
  clearHeartbeat(heartbeat: NodeJS.Timeout): void {
    clearInterval(heartbeat);
  }
}
