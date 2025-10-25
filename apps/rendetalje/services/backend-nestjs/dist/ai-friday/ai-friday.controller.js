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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiFridayController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const ai_friday_service_1 = require("./ai-friday.service");
const chat_sessions_service_1 = require("./chat-sessions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let AiFridayController = class AiFridayController {
    constructor(aiFridayService, chatSessionsService) {
        this.aiFridayService = aiFridayService;
        this.chatSessionsService = chatSessionsService;
    }
    async sendMessage(messageData, req) {
        const { message, sessionId, context } = messageData;
        context.organizationId = req.user.organizationId;
        context.userRole = req.user.role;
        let session;
        let conversationHistory = [];
        if (sessionId) {
            session = await this.chatSessionsService.getSession(sessionId, req.user.id);
            conversationHistory = await this.chatSessionsService.getConversationHistory(sessionId, req.user.id);
        }
        else {
            session = await this.chatSessionsService.createSession(req.user.id, req.user.organizationId, context);
        }
        await this.chatSessionsService.addMessage(session.id, 'user', message);
        const response = await this.aiFridayService.sendMessage(message, context, conversationHistory);
        await this.chatSessionsService.addMessage(session.id, 'assistant', response.message, {
            actions: response.actions,
            suggestions: response.suggestions,
            data: response.data,
        });
        return {
            sessionId: session.id,
            response,
        };
    }
    async streamMessage(messageData, req, res) {
        const { message, sessionId, context } = messageData;
        context.organizationId = req.user.organizationId;
        context.userRole = req.user.role;
        let session;
        let conversationHistory = [];
        if (sessionId) {
            session = await this.chatSessionsService.getSession(sessionId, req.user.id);
            conversationHistory = await this.chatSessionsService.getConversationHistory(sessionId, req.user.id);
        }
        else {
            session = await this.chatSessionsService.createSession(req.user.id, req.user.organizationId, context);
        }
        await this.chatSessionsService.addMessage(session.id, 'user', message);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
            const stream = await this.aiFridayService.streamMessage(message, context, conversationHistory);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                res.write(`data: ${JSON.stringify({ chunk, sessionId: session.id })}\n\n`);
            }
            await this.chatSessionsService.addMessage(session.id, 'assistant', fullResponse);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
        catch (error) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
    async transcribeAudio(file, language = 'da') {
        if (!file) {
            throw new Error('No audio file provided');
        }
        const text = await this.aiFridayService.transcribeAudio(file.buffer, language);
        return { text };
    }
    async synthesizeSpeech(data, res) {
        const audioBuffer = await this.aiFridayService.synthesizeSpeech(data.text, data.language || 'da');
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', audioBuffer.length);
        res.send(audioBuffer);
    }
    async getUserSessions(req, limit = 20) {
        return this.chatSessionsService.getUserSessions(req.user.id, req.user.organizationId, limit);
    }
    async getSession(sessionId, req) {
        const session = await this.chatSessionsService.getSession(sessionId, req.user.id);
        const messages = await this.chatSessionsService.getSessionMessages(sessionId, req.user.id);
        return {
            session,
            messages,
        };
    }
    async updateSession(sessionId, updates, req) {
        return this.chatSessionsService.updateSession(sessionId, req.user.id, updates);
    }
    async deleteSession(sessionId, req) {
        return this.chatSessionsService.deleteSession(sessionId, req.user.id);
    }
    async searchSessions(query, limit = 10, req) {
        return this.chatSessionsService.searchSessions(req.user.id, req.user.organizationId, query, limit);
    }
    async getAnalytics(dateFrom, dateTo, req) {
        return this.chatSessionsService.getSessionAnalytics(req.user.organizationId, dateFrom, dateTo);
    }
    async healthCheck() {
        const isHealthy = await this.aiFridayService.healthCheck();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AiFridayController = AiFridayController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Send message to AI Friday' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('chat/stream'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Stream message to AI Friday' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Streaming response' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "streamMessage", null);
__decorate([
    (0, common_1.Post)('voice/transcribe'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Transcribe audio to text' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "transcribeAudio", null);
__decorate([
    (0, common_1.Post)('voice/synthesize'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Convert text to speech' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "synthesizeSpeech", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get user chat sessions' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "getUserSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat session details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "getSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Update chat session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete chat session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)('sessions/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Search chat sessions' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "searchSessions", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI Friday usage analytics' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Check AI Friday service health' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiFridayController.prototype, "healthCheck", null);
exports.AiFridayController = AiFridayController = __decorate([
    (0, swagger_1.ApiTags)('AI Friday'),
    (0, common_1.Controller)('ai-friday'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ai_friday_service_1.AiFridayService,
        chat_sessions_service_1.ChatSessionsService])
], AiFridayController);
//# sourceMappingURL=ai-friday.controller.js.map