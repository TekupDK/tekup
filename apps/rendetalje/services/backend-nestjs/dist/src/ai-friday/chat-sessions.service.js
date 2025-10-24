"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatSessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSessionsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ChatSessionsService = ChatSessionsService_1 = class ChatSessionsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(ChatSessionsService_1.name);
    }
    async createSession(userId, organizationId, context, title) {
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
                .from('chat_sessions')
                .insert(sessionData)
                .select()
                .single();
            if (error) {
                throw new common_1.BadRequestException(`Failed to create chat session: ${error.message}`);
            }
            this.logger.log(`Chat session created: ${data.id}`);
            return data;
        }
        catch (error) {
            this.logger.error('Failed to create chat session', error);
            throw error;
        }
    }
    async getSession(sessionId, userId) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    throw new common_1.NotFoundException('Chat session not found');
                }
                throw new common_1.BadRequestException(`Failed to get chat session: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            this.logger.error('Failed to get chat session', error);
            throw error;
        }
    }
    async getUserSessions(userId, organizationId, limit = 20) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) {
                throw new common_1.BadRequestException(`Failed to get user sessions: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Failed to get user sessions', error);
            throw error;
        }
    }
    async updateSession(sessionId, userId, updates) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('chat_sessions')
                .update(updates)
                .eq('id', sessionId)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) {
                throw new common_1.BadRequestException(`Failed to update chat session: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            this.logger.error('Failed to update chat session', error);
            throw error;
        }
    }
    async deleteSession(sessionId, userId) {
        try {
            const { error } = await this.supabaseService.client
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);
            if (error) {
                throw new common_1.BadRequestException(`Failed to delete chat session: ${error.message}`);
            }
            this.logger.log(`Chat session deleted: ${sessionId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete chat session', error);
            throw error;
        }
    }
    async addMessage(sessionId, role, content, metadata = {}) {
        try {
            const messageData = {
                session_id: sessionId,
                role,
                content,
                metadata,
            };
            const { data, error } = await this.supabaseService.client
                .from('chat_messages')
                .insert(messageData)
                .select()
                .single();
            if (error) {
                throw new common_1.BadRequestException(`Failed to add chat message: ${error.message}`);
            }
            await this.supabaseService.client
                .from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId);
            return data;
        }
        catch (error) {
            this.logger.error('Failed to add chat message', error);
            throw error;
        }
    }
    async getSessionMessages(sessionId, userId, limit = 50) {
        try {
            await this.getSession(sessionId, userId);
            const { data, error } = await this.supabaseService.client
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(limit);
            if (error) {
                throw new common_1.BadRequestException(`Failed to get session messages: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Failed to get session messages', error);
            throw error;
        }
    }
    async getConversationHistory(sessionId, userId, limit = 10) {
        const messages = await this.getSessionMessages(sessionId, userId, limit);
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            metadata: msg.metadata,
        }));
    }
    async searchSessions(userId, organizationId, query, limit = 10) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .ilike('title', `%${query}%`)
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) {
                throw new common_1.BadRequestException(`Failed to search sessions: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Failed to search sessions', error);
            throw error;
        }
    }
    async getSessionAnalytics(organizationId, dateFrom, dateTo) {
        try {
            const { data: sessionStats, error: sessionError } = await this.supabaseService.client
                .from('chat_sessions')
                .select('id, context, created_at')
                .eq('organization_id', organizationId)
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo);
            if (sessionError) {
                throw new common_1.BadRequestException(`Failed to get session analytics: ${sessionError.message}`);
            }
            const { data: messageStats, error: messageError } = await this.supabaseService.client
                .from('chat_messages')
                .select(`
          id,
          role,
          created_at,
          chat_sessions!inner(organization_id)
        `)
                .eq('chat_sessions.organization_id', organizationId)
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo);
            if (messageError) {
                throw new common_1.BadRequestException(`Failed to get message analytics: ${messageError.message}`);
            }
            const totalSessions = sessionStats?.length || 0;
            const totalMessages = messageStats?.length || 0;
            const userMessages = messageStats?.filter(m => m.role === 'user').length || 0;
            const assistantMessages = messageStats?.filter(m => m.role === 'assistant').length || 0;
            const sessionsByContext = (sessionStats || []).reduce((acc, session) => {
                acc[session.context] = (acc[session.context] || 0) + 1;
                return acc;
            }, {});
            const dailyUsage = (sessionStats || []).reduce((acc, session) => {
                const date = session.created_at.split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});
            return {
                totalSessions,
                totalMessages,
                userMessages,
                assistantMessages,
                averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
                sessionsByContext,
                dailyUsage,
            };
        }
        catch (error) {
            this.logger.error('Failed to get session analytics', error);
            throw error;
        }
    }
    generateSessionTitle(context) {
        const timestamp = new Date().toLocaleString('da-DK');
        if (context.currentPage) {
            return `Chat fra ${context.currentPage} - ${timestamp}`;
        }
        return `Friday Chat - ${timestamp}`;
    }
};
exports.ChatSessionsService = ChatSessionsService;
exports.ChatSessionsService = ChatSessionsService = ChatSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ChatSessionsService);
//# sourceMappingURL=chat-sessions.service.js.map