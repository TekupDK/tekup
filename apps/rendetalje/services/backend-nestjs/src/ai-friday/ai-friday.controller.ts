import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
  Patch,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { AiFridayService, FridayContext } from './ai-friday.service';
import { ChatSessionsService } from './chat-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('AI Friday')
@Controller('ai-friday')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiFridayController {
  constructor(
    private readonly aiFridayService: AiFridayService,
    private readonly chatSessionsService: ChatSessionsService,
  ) {}

  // Chat Management
  @Post('chat')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Send message to AI Friday' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(
    @Body() messageData: {
      message: string;
      sessionId?: string;
      context: FridayContext;
    },
    @Request() req,
  ) {
    const { message, sessionId, context } = messageData;
    
    // Ensure context has user info
    context.organizationId = req.user.organizationId;
    context.userRole = req.user.role;

    let session;
    let conversationHistory = [];

    // Get or create session
    if (sessionId) {
      session = await this.chatSessionsService.getSession(sessionId, req.user.id);
      conversationHistory = await this.chatSessionsService.getConversationHistory(sessionId, req.user.id);
    } else {
      session = await this.chatSessionsService.createSession(
        req.user.id,
        req.user.organizationId,
        context,
      );
    }

    // Add user message to session
    await this.chatSessionsService.addMessage(session.id, 'user', message);

    // Get AI response
    const response = await this.aiFridayService.sendMessage(message, context, conversationHistory);

    // Add assistant response to session
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

  @Post('chat/stream')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Stream message to AI Friday' })
  @ApiResponse({ status: 200, description: 'Streaming response' })
  async streamMessage(
    @Body() messageData: {
      message: string;
      sessionId?: string;
      context: FridayContext;
    },
    @Request() req,
    @Res() res: Response,
  ) {
    const { message, sessionId, context } = messageData;
    
    context.organizationId = req.user.organizationId;
    context.userRole = req.user.role;

    let session;
    let conversationHistory = [];

    if (sessionId) {
      session = await this.chatSessionsService.getSession(sessionId, req.user.id);
      conversationHistory = await this.chatSessionsService.getConversationHistory(sessionId, req.user.id);
    } else {
      session = await this.chatSessionsService.createSession(
        req.user.id,
        req.user.organizationId,
        context,
      );
    }

    // Add user message
    await this.chatSessionsService.addMessage(session.id, 'user', message);

    // Set up SSE headers
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

      // Add complete response to session
      await this.chatSessionsService.addMessage(session.id, 'assistant', fullResponse);

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  // Voice Input/Output
  @Post('voice/transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Transcribe audio to text' })
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language: string = 'da',
  ) {
    if (!file) {
      throw new Error('No audio file provided');
    }

    const text = await this.aiFridayService.transcribeAudio(file.buffer, language);
    return { text };
  }

  @Post('voice/synthesize')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Convert text to speech' })
  async synthesizeSpeech(
    @Body() data: { text: string; language?: string },
    @Res() res: Response,
  ) {
    const audioBuffer = await this.aiFridayService.synthesizeSpeech(
      data.text,
      data.language || 'da',
    );

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  }

  // Session Management
  @Get('sessions')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get user chat sessions' })
  async getUserSessions(@Request() req, @Query('limit') limit: number = 20) {
    return this.chatSessionsService.getUserSessions(
      req.user.id,
      req.user.organizationId,
      limit,
    );
  }

  @Get('sessions/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get chat session details' })
  async getSession(@Param('id') sessionId: string, @Request() req) {
    const session = await this.chatSessionsService.getSession(sessionId, req.user.id);
    const messages = await this.chatSessionsService.getSessionMessages(sessionId, req.user.id);
    
    return {
      session,
      messages,
    };
  }

  @Patch('sessions/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update chat session' })
  async updateSession(
    @Param('id') sessionId: string,
    @Body() updates: { title?: string; metadata?: Record<string, any> },
    @Request() req,
  ) {
    return this.chatSessionsService.updateSession(sessionId, req.user.id, updates);
  }

  @Delete('sessions/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete chat session' })
  async deleteSession(@Param('id') sessionId: string, @Request() req) {
    return this.chatSessionsService.deleteSession(sessionId, req.user.id);
  }

  @Get('sessions/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Search chat sessions' })
  async searchSessions(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.chatSessionsService.searchSessions(
      req.user.id,
      req.user.organizationId,
      query,
      limit,
    );
  }

  // Analytics (Admin only)
  @Get('analytics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get AI Friday usage analytics' })
  async getAnalytics(
    @Query('from') dateFrom: string,
    @Query('to') dateTo: string,
    @Request() req,
  ) {
    return this.chatSessionsService.getSessionAnalytics(
      req.user.organizationId,
      dateFrom,
      dateTo,
    );
  }

  // Health Check
  @Get('health')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check AI Friday service health' })
  async healthCheck() {
    const isHealthy = await this.aiFridayService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}