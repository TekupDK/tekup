import { Response } from 'express';
import { AiFridayService, FridayContext } from './ai-friday.service';
import { ChatSessionsService } from './chat-sessions.service';
export declare class AiFridayController {
    private readonly aiFridayService;
    private readonly chatSessionsService;
    constructor(aiFridayService: AiFridayService, chatSessionsService: ChatSessionsService);
    sendMessage(messageData: {
        message: string;
        sessionId?: string;
        context: FridayContext;
    }, req: any): Promise<{
        sessionId: any;
        response: import("./ai-friday.service").FridayResponse;
    }>;
    streamMessage(messageData: {
        message: string;
        sessionId?: string;
        context: FridayContext;
    }, req: any, res: Response): Promise<void>;
    transcribeAudio(file: Express.Multer.File, language?: string): Promise<{
        text: string;
    }>;
    synthesizeSpeech(data: {
        text: string;
        language?: string;
    }, res: Response): Promise<void>;
    getUserSessions(req: any, limit?: number): Promise<import("./chat-sessions.service").ChatSession[]>;
    getSession(sessionId: string, req: any): Promise<{
        session: import("./chat-sessions.service").ChatSession;
        messages: import("./chat-sessions.service").ChatMessage[];
    }>;
    updateSession(sessionId: string, updates: {
        title?: string;
        metadata?: Record<string, any>;
    }, req: any): Promise<import("./chat-sessions.service").ChatSession>;
    deleteSession(sessionId: string, req: any): Promise<void>;
    searchSessions(query: string, limit: number, req: any): Promise<import("./chat-sessions.service").ChatSession[]>;
    getAnalytics(dateFrom: string, dateTo: string, req: any): Promise<any>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
