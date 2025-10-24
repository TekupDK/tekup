import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { FridayMessage, FridayContext } from "./ai-friday.service";

export interface ChatSession {
  id: string;
  user_id: string;
  organization_id: string;
  context: string;
  title?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

@Injectable()
export class ChatSessionsService {
  private readonly logger = new Logger(ChatSessionsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createSession(
    userId: string,
    organizationId: string,
    context: FridayContext,
    title?: string
  ): Promise<ChatSession> {
    try {
      const sessionData = {
        user_id: userId,
        organization_id: organizationId,
        context: context.userRole,
        title: title || this.generateSessionTitle(context),
        metadata: {
          currentPage: context.currentPage,
          selectedJobId: context.selectedJobId,
          selectedCustomerId: context.selectedCustomerId,
          selectedTeamMemberId: context.selectedTeamMemberId,
          preferences: context.preferences,
        },
      };

      const { data, error } = await this.supabaseService.client
        .from("chat_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(
          `Failed to create chat session: ${error.message}`
        );
      }

      this.logger.log(`Chat session created: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error("Failed to create chat session", error);
      throw error;
    }
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new NotFoundException("Chat session not found");
        }
        throw new BadRequestException(
          `Failed to get chat session: ${error.message}`
        );
      }

      return data;
    } catch (error) {
      this.logger.error("Failed to get chat session", error);
      throw error;
    }
  }

  async getUserSessions(
    userId: string,
    organizationId: string,
    limit: number = 20
  ): Promise<ChatSession[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new BadRequestException(
          `Failed to get user sessions: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      this.logger.error("Failed to get user sessions", error);
      throw error;
    }
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("chat_sessions")
        .update(updates)
        .eq("id", sessionId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(
          `Failed to update chat session: ${error.message}`
        );
      }

      return data;
    } catch (error) {
      this.logger.error("Failed to update chat session", error);
      throw error;
    }
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) {
        throw new BadRequestException(
          `Failed to delete chat session: ${error.message}`
        );
      }

      this.logger.log(`Chat session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error("Failed to delete chat session", error);
      throw error;
    }
  }

  async addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<ChatMessage> {
    try {
      const messageData = {
        session_id: sessionId,
        role,
        content,
        metadata,
      };

      const { data, error } = await this.supabaseService.client
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(
          `Failed to add chat message: ${error.message}`
        );
      }

      // Update session's updated_at timestamp
      await this.supabaseService.client
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return data;
    } catch (error) {
      this.logger.error("Failed to add chat message", error);
      throw error;
    }
  }

  async getSessionMessages(
    sessionId: string,
    userId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      // Verify user has access to this session
      await this.getSession(sessionId, userId);

      const { data, error } = await this.supabaseService.client
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) {
        throw new BadRequestException(
          `Failed to get session messages: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      this.logger.error("Failed to get session messages", error);
      throw error;
    }
  }

  async getConversationHistory(
    sessionId: string,
    userId: string,
    limit: number = 10
  ): Promise<FridayMessage[]> {
    const messages = await this.getSessionMessages(sessionId, userId, limit);

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
      metadata: msg.metadata,
    }));
  }

  async searchSessions(
    userId: string,
    organizationId: string,
    query: string,
    limit: number = 10
  ): Promise<ChatSession[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .ilike("title", `%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new BadRequestException(
          `Failed to search sessions: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      this.logger.error("Failed to search sessions", error);
      throw error;
    }
  }

  async getSessionAnalytics(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<any> {
    try {
      // Get session count and message count
      const { data: sessionStats, error: sessionError } =
        await this.supabaseService.client
          .from("chat_sessions")
          .select("id, context, created_at")
          .eq("organization_id", organizationId)
          .gte("created_at", dateFrom)
          .lte("created_at", dateTo);

      if (sessionError) {
        throw new BadRequestException(
          `Failed to get session analytics: ${sessionError.message}`
        );
      }

      const { data: messageStats, error: messageError } =
        await this.supabaseService.client
          .from("chat_messages")
          .select(
            `
          id,
          role,
          created_at,
          chat_sessions!inner(organization_id)
        `
          )
          .eq("chat_sessions.organization_id", organizationId)
          .gte("created_at", dateFrom)
          .lte("created_at", dateTo);

      if (messageError) {
        throw new BadRequestException(
          `Failed to get message analytics: ${messageError.message}`
        );
      }

      // Calculate analytics
      const totalSessions = sessionStats?.length || 0;
      const totalMessages = messageStats?.length || 0;
      const userMessages =
        messageStats?.filter((m) => m.role === "user").length || 0;
      const assistantMessages =
        messageStats?.filter((m) => m.role === "assistant").length || 0;

      // Group by context (user role)
      const sessionsByContext = (sessionStats || []).reduce(
        (acc, session) => {
          acc[session.context] = (acc[session.context] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Daily usage
      const dailyUsage = (sessionStats || []).reduce(
        (acc, session) => {
          const date = session.created_at.split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalSessions,
        totalMessages,
        userMessages,
        assistantMessages,
        averageMessagesPerSession:
          totalSessions > 0 ? totalMessages / totalSessions : 0,
        sessionsByContext,
        dailyUsage,
      };
    } catch (error) {
      this.logger.error("Failed to get session analytics", error);
      throw error;
    }
  }

  private generateSessionTitle(context: FridayContext): string {
    const timestamp = new Date().toLocaleString("da-DK");

    if (context.currentPage) {
      return `Chat fra ${context.currentPage} - ${timestamp}`;
    }

    return `Friday Chat - ${timestamp}`;
  }
}
