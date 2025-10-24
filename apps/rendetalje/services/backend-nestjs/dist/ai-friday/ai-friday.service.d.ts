import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LeadsService } from '../leads/leads.service';
import { CustomersService } from '../customers/customers.service';
import { TeamService } from '../team/team.service';
export interface FridayMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface FridayContext {
    userRole: string;
    organizationId: string;
    currentPage?: string;
    selectedJobId?: string;
    selectedCustomerId?: string;
    selectedTeamMemberId?: string;
    recentActions?: string[];
    preferences?: Record<string, any>;
}
export interface FridayResponse {
    message: string;
    actions?: {
        type: 'navigate' | 'create' | 'update' | 'search' | 'call_function';
        payload: any;
    }[];
    suggestions?: string[];
    data?: any;
}
export declare class AiFridayService {
    private readonly httpService;
    private readonly configService;
    private readonly leadsService;
    private readonly customersService;
    private readonly teamService;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, configService: ConfigService, leadsService: LeadsService, customersService: CustomersService, teamService: TeamService);
    sendMessage(message: string, context: FridayContext, conversationHistory?: FridayMessage[]): Promise<FridayResponse>;
    streamMessage(message: string, context: FridayContext, conversationHistory?: FridayMessage[]): Promise<AsyncIterable<string>>;
    private buildContextualPrompt;
    private processActions;
    private searchJobs;
    private searchCustomers;
    private getTeamSchedule;
    private createJob;
    private parseStreamResponse;
    transcribeAudio(audioBuffer: Buffer, language?: string): Promise<string>;
    synthesizeSpeech(text: string, language?: string): Promise<Buffer>;
    healthCheck(): Promise<boolean>;
}
