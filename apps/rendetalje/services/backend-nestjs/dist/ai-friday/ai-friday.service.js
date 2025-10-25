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
var AiFridayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiFridayService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const leads_service_1 = require("../leads/leads.service");
const customers_service_1 = require("../customers/customers.service");
const team_service_1 = require("../team/team.service");
let AiFridayService = AiFridayService_1 = class AiFridayService {
    constructor(httpService, configService, leadsService, customersService, teamService) {
        this.httpService = httpService;
        this.configService = configService;
        this.leadsService = leadsService;
        this.customersService = customersService;
        this.teamService = teamService;
        this.logger = new common_1.Logger(AiFridayService_1.name);
        this.baseUrl = this.configService.get('integrations.aiFriday.url');
        this.apiKey = this.configService.get('integrations.aiFriday.apiKey');
        if (!this.baseUrl || !this.apiKey) {
            this.logger.warn('AI Friday integration not configured properly');
        }
    }
    async sendMessage(message, context, conversationHistory = []) {
        try {
            this.logger.debug('Sending message to AI Friday', {
                message: message.substring(0, 100),
                userRole: context.userRole
            });
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat`, {
                messages: conversation,
                context: context,
                stream: false,
                temperature: 0.7,
                max_tokens: 1000,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            }).pipe((0, rxjs_1.timeout)(60000), (0, rxjs_1.retry)(2), (0, rxjs_1.catchError)((error) => {
                this.logger.error('AI Friday request failed:', error.message);
                throw error;
            })));
            const fridayResponse = response.data;
            if (fridayResponse.actions) {
                await this.processActions(fridayResponse.actions, context);
            }
            this.logger.debug('AI Friday response received', {
                hasActions: !!fridayResponse.actions?.length,
                hasSuggestions: !!fridayResponse.suggestions?.length
            });
            return fridayResponse;
        }
        catch (error) {
            this.logger.error('Failed to get response from AI Friday', error);
            return {
                message: 'Beklager, jeg har problemer med at forbinde til AI Friday lige nu. Prøv igen senere.',
                suggestions: ['Prøv igen', 'Kontakt support'],
            };
        }
    }
    async streamMessage(message, context, conversationHistory = []) {
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/chat/stream`, {
                messages: conversation,
                context: context,
                stream: true,
                temperature: 0.7,
                max_tokens: 1000,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'stream',
            }));
            return this.parseStreamResponse(response.data);
        }
        catch (error) {
            this.logger.error('Failed to stream from AI Friday', error);
            throw new common_1.BadRequestException('Failed to stream response from AI Friday');
        }
    }
    async buildContextualPrompt(message, context) {
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
        if (context.selectedJobId) {
            try {
                this.logger.debug('Job context not yet implemented with LeadsService');
            }
            catch (error) {
                this.logger.warn('Could not fetch job context', error);
            }
        }
        if (context.selectedCustomerId) {
            try {
                this.logger.debug('Customer context lookup not yet implemented');
            }
            catch (error) {
                this.logger.warn('Could not fetch customer context', error);
            }
        }
        if (context.recentActions && context.recentActions.length > 0) {
            prompt += `\n\nSeneste handlinger: ${context.recentActions.join(', ')}`;
        }
        return prompt;
    }
    async processActions(actions, context) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'search_jobs':
                        this.logger.debug('search_jobs action not yet implemented');
                        break;
                    case 'search_customers':
                        this.logger.debug('search_customers action not yet implemented');
                        break;
                    case 'get_team_schedule':
                        await this.getTeamSchedule(action.payload, context.organizationId);
                        break;
                    case 'create_job':
                        if (context.userRole === 'owner' || context.userRole === 'admin') {
                            this.logger.debug('create_job action not yet implemented');
                        }
                        break;
                    default:
                        this.logger.warn(`Unknown action type: ${action.type}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to process action ${action.type}:`, error);
            }
        }
    }
    async searchJobs(payload, organizationId) {
        this.logger.debug('searchJobs not yet implemented');
        return [];
    }
    async searchCustomers(payload, organizationId) {
        this.logger.debug('searchCustomers not yet implemented');
        return [];
    }
    async getTeamSchedule(payload, organizationId) {
        this.logger.debug('getTeamSchedule not yet implemented');
        return null;
    }
    async createJob(payload, organizationId) {
        this.logger.debug('createJob not yet implemented');
        return null;
    }
    async *parseStreamResponse(stream) {
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
                    }
                    catch (error) {
                    }
                }
            }
        }
    }
    async transcribeAudio(audioBuffer, language = 'da') {
        try {
            const formData = new FormData();
            const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
            formData.append('audio', new Blob([arrayBuffer]), 'audio.wav');
            formData.append('language', language);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/transcribe`, formData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'multipart/form-data',
                },
            }));
            return response.data.text;
        }
        catch (error) {
            this.logger.error('Failed to transcribe audio', error);
            throw new common_1.BadRequestException('Failed to transcribe audio');
        }
    }
    async synthesizeSpeech(text, language = 'da') {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/synthesize`, { text, language }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
            }));
            return Buffer.from(response.data);
        }
        catch (error) {
            this.logger.error('Failed to synthesize speech', error);
            throw new common_1.BadRequestException('Failed to synthesize speech');
        }
    }
    async healthCheck() {
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            }));
            return true;
        }
        catch (error) {
            this.logger.error('AI Friday health check failed', error);
            return false;
        }
    }
};
exports.AiFridayService = AiFridayService;
exports.AiFridayService = AiFridayService = AiFridayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        leads_service_1.LeadsService,
        customers_service_1.CustomersService,
        team_service_1.TeamService])
], AiFridayService);
//# sourceMappingURL=ai-friday.service.js.map