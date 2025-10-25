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
const prisma_service_1 = require("../database/prisma.service");
let ChatSessionsService = ChatSessionsService_1 = class ChatSessionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChatSessionsService_1.name);
    }
    async createSession(userId, organizationId, context, title) {
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
        }
        catch (error) {
            this.logger.error('Failed to create chat session', error);
            throw new common_1.BadRequestException('Failed to create chat session');
        }
    }
    async getSession(sessionId, userId) {
        try {
            const session = await this.prisma.renosChatSession.findFirst({
                where: {
                    id: sessionId,
                    userId,
                },
            });
            if (!session) {
                throw new common_1.NotFoundException('Chat session not found');
            }
            return this.mapSessionToInterface(session);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Failed to get chat session', error);
            throw new common_1.BadRequestException('Failed to get chat session');
        }
    }
    async getUserSessions(userId, organizationId, limit = 20) {
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
        }
        catch (error) {
            this.logger.error('Failed to get user sessions', error);
            throw new common_1.BadRequestException('Failed to get user sessions');
        }
    }
    async updateSession(sessionId, userId, updates) {
        try {
            const session = await this.prisma.renosChatSession.update({
                where: {
                    id: sessionId,
                    userId,
                },
                data: updates,
            });
            return this.mapSessionToInterface(session);
        }
        catch (error) {
            this.logger.error('Failed to update chat session', error);
            throw new common_1.BadRequestException('Failed to update chat session');
        }
    }
    async deleteSession(sessionId, userId) {
        try {
            await this.prisma.renosChatSession.delete({
                where: {
                    id: sessionId,
                    userId,
                },
            });
            this.logger.log(`Chat session deleted: ${sessionId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete chat session', error);
            throw new common_1.BadRequestException('Failed to delete chat session');
        }
    }
    async addMessage(sessionId, role, content, metadata = {}) {
        try {
            const message = await this.prisma.renosChatMessage.create({
                data: {
                    sessionId,
                    role,
                    content,
                    metadata,
                },
            });
            await this.prisma.renosChatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
            });
            return this.mapMessageToInterface(message);
        }
        catch (error) {
            this.logger.error('Failed to add chat message', error);
            throw new common_1.BadRequestException('Failed to add chat message');
        }
    }
    async getSessionMessages(sessionId, userId, limit = 50) {
        try {
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
            timestamp: msg.createdAt.toISOString(),
            metadata: msg.metadata,
        }));
    }
    async searchSessions(userId, organizationId, query, limit = 10) {
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
        }
        catch (error) {
            this.logger.error('Failed to search sessions', error);
            throw new common_1.BadRequestException('Failed to search sessions');
        }
    }
    async getSessionAnalytics(organizationId, dateFrom, dateTo) {
        try {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
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
            const totalSessions = sessions.length;
            const totalMessages = messages.length;
            const userMessages = messages.filter(m => m.role === 'user').length;
            const assistantMessages = messages.filter(m => m.role === 'assistant').length;
            const sessionsByContext = sessions.reduce((acc, session) => {
                acc[session.context] = (acc[session.context] || 0) + 1;
                return acc;
            }, {});
            const dailyUsage = sessions.reduce((acc, session) => {
                const date = session.createdAt.toISOString().split('T')[0];
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
            throw new common_1.BadRequestException('Failed to get session analytics');
        }
    }
    generateSessionTitle(context) {
        const timestamp = new Date().toLocaleString('da-DK');
        if (context.currentPage) {
            return `Chat fra ${context.currentPage} - ${timestamp}`;
        }
        return `Friday Chat - ${timestamp}`;
    }
    mapSessionToInterface(session) {
        return {
            id: session.id,
            userId: session.userId,
            organizationId: session.organizationId,
            context: session.context,
            title: session.title,
            metadata: session.metadata || {},
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
    mapMessageToInterface(message) {
        return {
            id: message.id,
            sessionId: message.sessionId,
            role: message.role,
            content: message.content,
            metadata: message.metadata || {},
            createdAt: message.createdAt,
        };
    }
};
exports.ChatSessionsService = ChatSessionsService;
exports.ChatSessionsService = ChatSessionsService = ChatSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatSessionsService);
//# sourceMappingURL=chat-sessions.service.js.map