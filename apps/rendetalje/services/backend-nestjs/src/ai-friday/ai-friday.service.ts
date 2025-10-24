import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
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

@Injectable()
export class AiFridayService {
  private readonly logger = new Logger(AiFridayService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly leadsService: LeadsService,
    private readonly customersService: CustomersService,
    private readonly teamService: TeamService,
  ) {
    this.baseUrl = this.configService.get<string>('integrations.aiFriday.url');
    this.apiKey = this.configService.get<string>('integrations.aiFriday.apiKey');

    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn('AI Friday integration not configured properly');
    }
  }

  async sendMessage(
    message: string,
    context: FridayContext,
    conversationHistory: FridayMessage[] = [],
  ): Promise<FridayResponse> {
    try {
      this.logger.debug('Sending message to AI Friday', { 
        message: message.substring(0, 100),
        userRole: context.userRole 
      });

      // Build context-aware prompt
      const contextualPrompt = await this.buildContextualPrompt(message, context);
      
      // Prepare conversation with system context
      const conversation = [
        {
          role: 'system',
          content: contextualPrompt,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat`,
          {
            messages: conversation,
            context: context,
            stream: false,
            temperature: 0.7,
            max_tokens: 1000,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        ).pipe(
          timeout(60000),
          retry(2),
          catchError((error) => {
            this.logger.error('AI Friday request failed:', error.message);
            throw error;
          }),
        ),
      );

      const fridayResponse: FridayResponse = response.data;

      // Process any function calls or actions
      if (fridayResponse.actions) {
        await this.processActions(fridayResponse.actions, context);
      }

      this.logger.debug('AI Friday response received', { 
        hasActions: !!fridayResponse.actions?.length,
        hasSuggestions: !!fridayResponse.suggestions?.length 
      });

      return fridayResponse;

    } catch (error) {
      this.logger.error('Failed to get response from AI Friday', error);
      
      // Fallback response
      return {
        message: 'Beklager, jeg har problemer med at forbinde til AI Friday lige nu. Prøv igen senere.',
        suggestions: ['Prøv igen', 'Kontakt support'],
      };
    }
  }

  async streamMessage(
    message: string,
    context: FridayContext,
    conversationHistory: FridayMessage[] = [],
  ): Promise<AsyncIterable<string>> {
    try {
      const contextualPrompt = await this.buildContextualPrompt(message, context);
      
      const conversation = [
        {
          role: 'system',
          content: contextualPrompt,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/stream`,
          {
            messages: conversation,
            context: context,
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
          }
        ),
      );

      return this.parseStreamResponse(response.data);

    } catch (error) {
      this.logger.error('Failed to stream from AI Friday', error);
      throw new BadRequestException('Failed to stream response from AI Friday');
    }
  }

  private async buildContextualPrompt(message: string, context: FridayContext): Promise<string> {
    let prompt = `Du er Friday, en AI-assistent for RendetaljeOS, et rengøringsfirma management system.

Brugerens rolle: ${context.userRole}
Nuværende side: ${context.currentPage || 'ikke specificeret'}

Du hjælper med:
- Jobstyring og planlægning
- Kundeservice og kommunikation
- Teamledelse og performance
- Rapporter og analyser
- Generelle spørgsmål om rengøring

Svar altid på dansk og vær hjælpsom og professionel.`;

    // Add role-specific context
    switch (context.userRole) {
      case 'owner':
        prompt += `\n\nSom ejer har du adgang til alle funktioner og kan se:
- Komplet overblik over virksomheden
- Finansielle rapporter og analyser
- Team performance og KPI'er
- Kundetilfredshed og reviews`;
        break;
      
      case 'admin':
        prompt += `\n\nSom administrator kan du:
- Administrere jobs og kunder
- Håndtere team og planlægning
- Se rapporter og analyser
- Konfigurere systemindstillinger`;
        break;
      
      case 'employee':
        prompt += `\n\nSom medarbejder kan du:
- Se dine tildelte jobs
- Registrere tid og status
- Kommunikere med kunder
- Få hjælp til procedurer`;
        break;
      
      case 'customer':
        prompt += `\n\nSom kunde kan du:
- Booke nye rengøringsopgaver
- Se din servicehistorik
- Kommunikere med teamet
- Give feedback og reviews`;
        break;
    }

    // Add current context data
    if (context.selectedJobId) {
      try {
        // TODO: Add lead/job context lookup using LeadsService
        this.logger.debug('Job context not yet implemented with LeadsService');
        // const lead = await this.leadsService.findOne(context.selectedJobId, context.organizationId);
        // prompt += `\n\nAktuelt valgte lead: ...`;
      } catch (error) {
        this.logger.warn('Could not fetch job context', error);
      }
    }

    if (context.selectedCustomerId) {
      try {
        // TODO: Update to match CustomersService method signature
        this.logger.debug('Customer context lookup not yet implemented');
        // const customer = await this.customersService.findOne(context.selectedCustomerId);
        // prompt += `\n\nAktuelt valgte kunde: ...`;
      } catch (error) {
        this.logger.warn('Could not fetch customer context', error);
      }
    }

    // Add recent actions for context
    if (context.recentActions && context.recentActions.length > 0) {
      prompt += `\n\nSeneste handlinger: ${context.recentActions.join(', ')}`;
    }

    return prompt;
  }

  private async processActions(actions: any[], context: FridayContext): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'search_jobs':
            // TODO: Implement with LeadsService
            this.logger.debug('search_jobs action not yet implemented');
            break;
          
          case 'search_customers':
            // TODO: Implement with CustomersService
            this.logger.debug('search_customers action not yet implemented');
            break;
          
          case 'get_team_schedule':
            await this.getTeamSchedule(action.payload, context.organizationId);
            break;
          
          case 'create_job':
            // TODO: Implement with LeadsService
            if (context.userRole === 'owner' || context.userRole === 'admin') {
              this.logger.debug('create_job action not yet implemented');
            }
            break;
          
          default:
            this.logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        this.logger.error(`Failed to process action ${action.type}:`, error);
      }
    }
  }

  private async searchJobs(payload: any, organizationId: string): Promise<any> {
    // TODO: Implement with LeadsService
    this.logger.debug('searchJobs not yet implemented');
    return [];
  }

  private async searchCustomers(payload: any, organizationId: string): Promise<any> {
    // TODO: Implement with CustomersService
    this.logger.debug('searchCustomers not yet implemented');
    return [];
  }

  private async getTeamSchedule(payload: any, organizationId: string): Promise<any> {
    // TODO: Update to match TeamService method signature
    this.logger.debug('getTeamSchedule not yet implemented');
    return null;
  }

  private async createJob(payload: any, organizationId: string): Promise<any> {
    // TODO: Implement with LeadsService
    this.logger.debug('createJob not yet implemented');
    return null;
  }

  private async *parseStreamResponse(stream: any): AsyncIterable<string> {
    let buffer = '';
    
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (error) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // Voice input support
  async transcribeAudio(audioBuffer: Buffer, language: string = 'da'): Promise<string> {
    try {
      const formData = new FormData();
      // Convert Buffer to ArrayBuffer for Blob compatibility
      const arrayBuffer = audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength
      ) as ArrayBuffer;
      formData.append('audio', new Blob([arrayBuffer]), 'audio.wav');
      formData.append('language', language);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transcribe`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        ),
      );

      return response.data.text;
    } catch (error) {
      this.logger.error('Failed to transcribe audio', error);
      throw new BadRequestException('Failed to transcribe audio');
    }
  }

  // Text-to-speech for responses
  async synthesizeSpeech(text: string, language: string = 'da'): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/synthesize`,
          { text, language },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
          }
        ),
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to synthesize speech', error);
      throw new BadRequestException('Failed to synthesize speech');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }),
      );
      return true;
    } catch (error) {
      this.logger.error('AI Friday health check failed', error);
      return false;
    }
  }
}