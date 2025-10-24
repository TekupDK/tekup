import { SupabaseService } from '../supabase/supabase.service';
import { FridayMessage, FridayContext } from './ai-friday.service';
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
    role: 'user' | 'assistant';
    content: string;
    metadata: Record<string, any>;
    created_at: string;
}
export declare class ChatSessionsService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    createSession(userId: string, organizationId: string, context: FridayContext, title?: string): Promise<ChatSession>;
    getSession(sessionId: string, userId: string): Promise<ChatSession>;
    getUserSessions(userId: string, organizationId: string, limit?: number): Promise<ChatSession[]>;
    updateSession(sessionId: string, userId: string, updates: Partial<ChatSession>): Promise<ChatSession>;
    deleteSession(sessionId: string, userId: string): Promise<void>;
    addMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<ChatMessage>;
    getSessionMessages(sessionId: string, userId: string, limit?: number): Promise<ChatMessage[]>;
    getConversationHistory(sessionId: string, userId: string, limit?: number): Promise<FridayMessage[]>;
    searchSessions(userId: string, organizationId: string, query: string, limit?: number): Promise<ChatSession[]>;
    getSessionAnalytics(organizationId: string, dateFrom: string, dateTo: string): Promise<any>;
    private generateSessionTitle;
}
