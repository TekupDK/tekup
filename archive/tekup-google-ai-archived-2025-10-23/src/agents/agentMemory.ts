/**
 * Agent Memory System - Conversation Context & User Preferences
 * 
 * Provides:
 * - Conversation history (last N messages)
 * - Context recall (find relevant past conversations)
 * - User preference learning
 * - Persistent storage in database
 * 
 * Usage:
 * ```typescript
 * cons      for (const response of responses) {
        this.addToHistory({
          role: "assistant",
          content: response.body,
          timestamp: response.createdAt,
          metadata: {
            emailId: response.id,
            status: response.status,
          },
        });
      }new AgentMemory();
 * 
 * // Add to conversation history
 * await memory.addToHistory({
 *   role: "user",
 *   content: "Jeg vil gerne booke en rengøring",
 *   metadata: { customerId: "abc123" }
 * });
 * 
 * // Recall relevant context
 * const context = await memory.recall("rengøring", 5);
 * 
 * // Learn preferences
 * await memory.learnPreference("preferred_time", "10:00");
 * ```
 */

import { logger } from "../logger";
import { prisma } from "../services/databaseService";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface StoredMessage extends Message {
  id: string;
  timestamp: Date;
  customerId?: string;
  leadId?: string;
}

export interface UserPreference {
  key: string;
  value: unknown;
  updatedAt: Date;
}

export class AgentMemory {
  private conversationHistory: StoredMessage[] = [];
  private preferences = new Map<string, unknown>();
  private maxHistorySize = 50; // Keep last 50 messages

  constructor(options?: { maxHistorySize?: number }) {
    if (options?.maxHistorySize) {
      this.maxHistorySize = options.maxHistorySize;
    }
  }

  /**
   * Add message to conversation history
   */
  addToHistory(message: Message): void {
    const storedMessage: StoredMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: message.timestamp || new Date(),
    };

    this.conversationHistory.push(storedMessage);

    // Trim to max size
    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistorySize);
    }

    logger.debug(
      {
        role: message.role,
        contentLength: message.content.length,
        historySize: this.conversationHistory.length,
      },
      "Added message to conversation history"
    );
  }

  /**
   * Get recent conversation history
   */
  getHistory(limit?: number): StoredMessage[] {
    const messages = this.conversationHistory;
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Recall relevant messages based on query
   * 
   * Simple keyword-based search (can be enhanced with embeddings)
   */
  recall(query: string, limit = 5): StoredMessage[] {
    const keywords = query.toLowerCase().split(/\s+/);

    // Score each message based on keyword matches
    const scored = this.conversationHistory.map((message) => {
      const content = message.content.toLowerCase();
      const score = keywords.reduce((acc, keyword) => {
        const count = (content.match(new RegExp(keyword, "g")) || []).length;
        return acc + count;
      }, 0);

      return { message, score };
    });

    // Sort by score (descending) and take top N
    const relevant = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.message);

    logger.debug(
      {
        query,
        matches: relevant.length,
        keywords: keywords.length,
      },
      "Recalled relevant messages"
    );

    return relevant;
  }

  /**
   * Build context string from recalled messages
   */
  buildContextString(messages: StoredMessage[]): string {
    if (messages.length === 0) return "";

    return messages
      .map((m) => {
        const timestamp = m.timestamp.toISOString().split("T")[0];
        return `[${timestamp}] ${m.role.toUpperCase()}: ${m.content}`;
      })
      .join("\n\n");
  }

  /**
   * Learn user preference
   */
  learnPreference(key: string, value: unknown): void {
    this.preferences.set(key, value);

    logger.debug(
      {
        key,
        value: typeof value === "object" ? JSON.stringify(value) : value,
      },
      "Learned user preference"
    );

    // Persist to database (optional - can be enabled later)
    // await this.persistPreference(key, value);
  }

  /**
   * Get user preference
   */
  getPreference<T = unknown>(key: string): T | undefined {
    return this.preferences.get(key) as T | undefined;
  }

  /**
   * Get all preferences
   */
  getAllPreferences(): Map<string, unknown> {
    return new Map(this.preferences);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    logger.info("Cleared conversation history");
  }

  /**
   * Clear preferences
   */
  clearPreferences(): void {
    this.preferences.clear();
    logger.info("Cleared user preferences");
  }

  /**
   * Get memory summary
   */
  getSummary(): {
    historySize: number;
    preferencesCount: number;
    oldestMessage?: Date;
    newestMessage?: Date;
  } {
    return {
      historySize: this.conversationHistory.length,
      preferencesCount: this.preferences.size,
      oldestMessage: this.conversationHistory[0]?.timestamp,
      newestMessage: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp,
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Persist preference to database (optional)
   * Can be enabled when user preference table is added
   */
  private persistPreference(key: string, _value: unknown): void {
    try {
      // This would require a UserPreference table in schema
      // Future implementation:
      // await prisma.userPreference.upsert({
      //   where: { key },
      //   update: { value: JSON.stringify(_value), updatedAt: new Date() },
      //   create: { key, value: JSON.stringify(_value) },
      // });

      logger.debug({ key }, "Preference persistence not yet implemented");
    } catch (error) {
      logger.error({ err: error, key }, "Failed to persist preference");
    }
  }

  /**
   * Load preferences from database (optional)
   */
  private loadPreferences(): void {
    try {
      // This would require a UserPreference table in schema
      // const prefs = await prisma.userPreference.findMany();
      // for (const pref of prefs) {
      //   this.preferences.set(pref.key, JSON.parse(pref.value as string));
      // }

      logger.debug({ count: this.preferences.size }, "Loaded preferences from database");
    } catch (error) {
      logger.error({ err: error }, "Failed to load preferences");
    }
  }
}

// Singleton instance for global memory
export const globalMemory = new AgentMemory();

/**
 * Customer-specific memory (for multi-tenant)
 */
export class CustomerMemory extends AgentMemory {
  private customerId: string;

  constructor(customerId: string, options?: { maxHistorySize?: number }) {
    super(options);
    this.customerId = customerId;
  }

  /**
   * Add message with customer context
   */
  addToHistory(message: Message): void {
    super.addToHistory({
      ...message,
      metadata: {
        ...message.metadata,
        customerId: this.customerId,
      },
    });
  }

  /**
   * Load conversation history from database
   */
  async loadFromDatabase(): Promise<void> {
    try {
      // Load from EmailResponse via Lead relation
      const responses = await prisma.emailResponse.findMany({
        where: {
          lead: {
            customerId: this.customerId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50, // maxHistorySize from parent
      });

      for (const response of responses.reverse()) {
        this.addToHistory({
          role: "assistant",
          content: response.body,
          timestamp: response.createdAt,
          metadata: {
            emailId: response.id,
            status: response.status,
          },
        });
      }

      logger.info(
        {
          customerId: this.customerId,
          loaded: responses.length,
        },
        "Loaded customer conversation history"
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          customerId: this.customerId,
        },
        "Failed to load customer history"
      );
    }
  }

  /**
   * Get customer ID
   */
  getCustomerId(): string {
    return this.customerId;
  }
}

/**
 * Memory manager for handling multiple customer memories
 */
export class MemoryManager {
  private memories = new Map<string, CustomerMemory>();

  /**
   * Get or create memory for customer
   */
  getMemory(customerId: string): CustomerMemory {
    let memory = this.memories.get(customerId);

    if (!memory) {
      memory = new CustomerMemory(customerId);
      this.memories.set(customerId, memory);

      logger.debug(
        {
          customerId,
          totalMemories: this.memories.size,
        },
        "Created new customer memory"
      );
    }

    return memory;
  }

  /**
   * Clear memory for customer
   */
  clearMemory(customerId: string): void {
    const memory = this.memories.get(customerId);
    if (memory) {
      memory.clearHistory();
      memory.clearPreferences();
      this.memories.delete(customerId);

      logger.info({ customerId }, "Cleared customer memory");
    }
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.memories.clear();
    logger.info("Cleared all customer memories");
  }

  /**
   * Get memory stats
   */
  getStats(): {
    totalCustomers: number;
    totalMessages: number;
    totalPreferences: number;
  } {
    let totalMessages = 0;
    let totalPreferences = 0;

    for (const memory of this.memories.values()) {
      const summary = memory.getSummary();
      totalMessages += summary.historySize;
      totalPreferences += summary.preferencesCount;
    }

    return {
      totalCustomers: this.memories.size,
      totalMessages,
      totalPreferences,
    };
  }
}

// Singleton memory manager
export const memoryManager = new MemoryManager();
