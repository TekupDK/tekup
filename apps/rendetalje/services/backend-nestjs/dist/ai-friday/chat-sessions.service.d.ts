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
export declare class ChatSessionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(userId: string, organizationId: string, context: FridayContext, title?: string): Promise<ChatSession>;
    getSession(sessionId: string, userId: string): Promise<ChatSession>;
    getUserSessions(userId: string, organizationId: string, limit?: number): Promise<ChatSession[]>;
    updateSession(sessionId: string, userId: string, updates: {
        title?: string;
        metadata?: Record<string, any>;
    }): Promise<ChatSession>;
    deleteSession(sessionId: string, userId: string): Promise<void>;
    addMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<ChatMessage>;
    getSessionMessages(sessionId: string, userId: string, limit?: number): Promise<ChatMessage[]>;
    getConversationHistory(sessionId: string, userId: string, limit?: number): Promise<FridayMessage[]>;
    searchSessions(userId: string, organizationId: string, query: string, limit?: number): Promise<ChatSession[]>;
    getSessionAnalytics(organizationId: string, dateFrom: string, dateTo: string): Promise<any>;
    private generateSessionTitle;
    private mapSessionToInterface;
    private mapMessageToInterface;
}
