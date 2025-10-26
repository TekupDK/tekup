import { 
  ChatMessage, 
  ChatConversation, 
  ChatRequest, 
  ChatResponse, 
  ChatMode, 
  ChatbotConfig,
  ChatAction,
  EmailContext,
  ChatbotCapabilities,
  ChatbotState
} from '../../shared/types/chatbot';
import { Email } from '../../shared/types/email';
import { AIService } from './AIService';
import { EmailService } from './EmailService';
import { DatabaseService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';

export class ChatbotService {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-main-service');

  private aiService: AIService;
  private emailService: EmailService;
  private dbService: DatabaseService;
  private config: ChatbotConfig;
  private conversations: Map<string, ChatConversation> = new Map();
  private isInitialized = false;

  constructor(
    aiService: AIService,
    emailService: EmailService,
    dbService: DatabaseService
  ) {
    this.aiService = aiService;
    this.emailService = emailService;
    this.dbService = dbService;
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Wait for dependencies to be ready
      while (!this.dbService.isReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize ChatbotService:', error);
      throw error;
    }
  }

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, conversationId, mode = 'standard', emailContext } = request;
      
      // Load or create conversation
      let conversation = conversationId 
        ? await this.loadConversation(conversationId)
        : null;
      
      if (!conversation) {
        conversation = {
          id: conversationId || uuidv4(),
          title: this.generateConversationTitle(message),
          mode,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          context: emailContext
        };
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: message,
        role: 'user',
        timestamp: new Date()
      };
      conversation.messages.push(userMessage);

      // Build context for AI
      const contextString = await this.buildConversationContext(conversation, message);
      const emailCtx = emailContext || conversation.context;
      
      // Generate AI response
      const aiResponse = await this.generateResponse(message, contextString, mode, emailCtx);
      
      // Create bot message
      const botMessage: ChatMessage = {
        id: uuidv4(),
        content: aiResponse.content,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          actions: aiResponse.actions
        }
      };
      conversation.messages.push(botMessage);

      // Update conversation
      conversation.updatedAt = new Date();
      if (emailContext) {
        conversation.context = emailContext;
      }

      // Save conversation and summary
      await this.saveConversation(conversation);
      await this.saveConversationSummary(conversation.id);

      return {
        message: botMessage.content,
        conversationId: conversation.id,
        messageId: botMessage.id,
        mode: request.mode,
        metadata: {
          tokens: aiResponse.tokens || 0,
          model: aiResponse.model || 'unknown',
          processingTime: Date.now() - userMessage.timestamp.getTime()
        },
        suggestions: this.generateSuggestions(aiResponse.content, mode),
        actions: aiResponse.actions || []
      };
    } catch (error) {
      logger.error('Error processing chatbot message:', error);
      throw error;
    }
  }

  buildEmailContext(emails: Email[]): EmailContext {
    if (!emails || emails.length === 0) {
      return {
        emails: [],
        totalCount: 0,
        summary: 'No emails in context'
      };
    }

    const emailSummaries = emails.map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      date: email.date,
      snippet: this.extractEmailSnippet(email),
      flags: email.flags,
      threadId: email.threadId
    }));

    const summary = this.generateEmailContextSummary(emails);

    return {
      emails: emailSummaries,
      totalCount: emails.length,
      summary,
      threads: this.groupEmailsByThread(emails)
    };
  }

  async buildConversationContext(conversation: ChatConversation, currentMessage: string): Promise<string> {
    const recentMessages = conversation.messages.slice(-10);
    
    let context = `Conversation: ${conversation.title}\nMode: ${conversation.mode}\n\n`;
    
    if (conversation.context) {
      context += `Email Context: ${conversation.context.summary}\n\n`;
    }
    
    // Add long-term memory
    const summaries = await this.getRelevantSummaries(currentMessage);
    if (summaries.length > 0) {
      context += 'Relevant Past Summaries:\n' + summaries.join('\n') + '\n\n';
    }
    
    context += 'Recent Messages:\n';
    recentMessages.forEach(msg => {
      context += `${msg.role}: ${msg.content}\n`;
    });
    
    // Add conversation summary if long
    if (conversation.messages.length > 10) {
      const summary = await this.generateConversationSummary(conversation);
      context = `Summary: ${summary}\n\n` + context;
    }
    
    return context;
  }
  
  private async generateConversationSummary(conversation: ChatConversation): Promise<string> {
    try {
      const aiSummary = await this.aiService.generateResponse({
        prompt: `Summarize this conversation concisely: ${conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
        model: 'gpt-3.5-turbo',
        maxTokens: 150
      });
      return aiSummary.text;
    } catch (error) {
      logger.error('Failed to generate conversation summary:', error);
      const keyPoints = conversation.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content.substring(0, 50))
        .join('; ');
      return `Key points: ${keyPoints}`;
    }
  }

  async saveConversationSummary(conversationId: string): Promise<void> {
    const conversation = await this.loadConversation(conversationId);
    if (!conversation) return;
    
    const summary = await this.generateConversationSummary(conversation);
    await this.dbService.saveConversationSummary(conversationId, summary);
  }

  async getRelevantSummaries(query: string): Promise<string[]> {
    // Assuming dbService has getConversationSummaries method
    // Simple retrieval - can be improved with vector search
    const summaries = await this.dbService.getConversationSummaries();
    return summaries
      .filter(s => s.summary.toLowerCase().includes(query.toLowerCase()))
      .map(s => s.summary)
      .slice(0, 3);
  }

  async generateResponse(
    message: string, 
    context: string, 
    mode: ChatMode,
    emailContext?: EmailContext
  ): Promise<{
    content: string;
    model: string;
    tokens: number;
    actions?: ChatAction[];
  }> {
    try {
      const systemPrompt = this.buildSystemPrompt(mode, emailContext);
      const fullPrompt = `${systemPrompt}\n\nContext:\n${context}\n\nUser: ${message}`;
      
      // Use different models based on mode
      const model = mode === 'smarter' ? 'gpt-4' : 'gpt-3.5-turbo';
      
      const aiResponse = await this.aiService.generateResponse({
        prompt: fullPrompt,
        model,
        maxTokens: mode === 'smarter' ? 2000 : 1000,
        temperature: 0.7
      });
      
      // Extract actions from response
      const actions = await this.extractActions(aiResponse.text, emailContext);
      
      return {
        content: aiResponse.text,
        model: aiResponse.model,
        tokens: aiResponse.usage?.totalTokens || 0,
        actions
      };
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  private generateSuggestions(response: string, mode: ChatMode): string[] {
    const suggestions: string[] = [];
    
    // Generate contextual suggestions based on response content
    if (response.toLowerCase().includes('email')) {
      suggestions.push('Compose a new email');
      suggestions.push('Search my emails');
    }
    
    if (response.toLowerCase().includes('schedule')) {
      suggestions.push('Schedule this email');
      suggestions.push('Set a reminder');
    }
    
    if (mode === 'smarter') {
      suggestions.push('Analyze email patterns');
      suggestions.push('Create automation rule');
    }
    
    return suggestions.slice(0, 3);
  }

  async extractActions(message: string, emailContext?: EmailContext): Promise<ChatAction[]> {
    const actions: ChatAction[] = [];
    
    // Simple pattern matching for now - can be enhanced with AI
    const actionPatterns = {
      compose: /(?:compose|write|send|create).+(?:email|message)/i,
      reply: /(?:reply|respond).+(?:to|email)/i,
      forward: /(?:forward|fwd).+email/i,
      archive: /(?:archive|move).+(?:email|message)/i,
      delete: /(?:delete|remove).+(?:email|message)/i,
      search: /(?:search|find|look for).+(?:email|message)/i,
      schedule: /(?:schedule|remind|later)/i
    };
    
    for (const [actionType, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(message)) {
        actions.push({
          type: actionType as any,
          label: this.getActionLabel(actionType),
          data: this.extractActionData(actionType, message, emailContext)
        });
      }
    }
    
    return actions;
  }

  async saveConversation(conversation: ChatConversation): Promise<void> {
    await this.dbService.saveConversation(conversation);
  }

  async loadConversation(conversationId: string): Promise<ChatConversation | null> {
    return await this.dbService.getConversation(conversationId);
  }

  async getConversations(): Promise<ChatConversation[]> {
    try {
      return await this.dbService.getConversations();
    } catch (error) {
      logger.error('Error getting conversations:', error);
      return [];
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.dbService.deleteConversation(conversationId);
      this.conversations.delete(conversationId);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
    }
  }

  getCapabilities(): ChatbotCapabilities {
    return {
      emailComposition: true,
      emailSummarization: true,
      emailSearch: true,
      workflowAutomation: true,
      scheduling: true,
      translation: true,
      codeGeneration: false,
      dataAnalysis: true
    };
  }

  getState(): ChatbotState {
    return {
      isActive: this.isInitialized,
      currentMode: this.config.defaultMode,
      activeConversation: Array.from(this.conversations.keys())[0],
      isTyping: false,
      lastActivity: new Date()
    };
  }

  updateConfig(config: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ChatbotConfig {
    return { ...this.config };
  }

  async executeAction(action: ChatAction): Promise<any> {
    try {
      switch (action.type) {
        case 'compose':
          return await this.handleComposeAction(action);
        case 'reply':
          return await this.handleReplyAction(action);
        case 'forward':
          return await this.handleForwardAction(action);
        case 'archive':
          return await this.handleArchiveAction(action);
        case 'delete':
          return await this.handleDeleteAction(action);
        case 'search':
          return await this.handleSearchAction(action);
        case 'schedule':
          return await this.handleScheduleAction(action);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      logger.error('Error executing action:', error);
      throw error;
    }
  }

  private async handleComposeAction(action: ChatAction): Promise<any> {
    // Implement compose email action
    return { success: true, message: 'Compose action executed' };
  }

  private async handleReplyAction(action: ChatAction): Promise<any> {
    // Implement reply to email action
    return { success: true, message: 'Reply action executed' };
  }

  private async handleForwardAction(action: ChatAction): Promise<any> {
    // Implement forward email action
    return { success: true, message: 'Forward action executed' };
  }

  private async handleArchiveAction(action: ChatAction): Promise<any> {
    // Implement archive email action
    return { success: true, message: 'Archive action executed' };
  }

  private async handleDeleteAction(action: ChatAction): Promise<any> {
    // Implement delete email action
    return { success: true, message: 'Delete action executed' };
  }

  private async handleSearchAction(action: ChatAction): Promise<any> {
    // Implement search emails action
    const query = action.data?.query || '';
    const results = await this.dbService.searchEmails(query);
    return { success: true, results };
  }

  private async handleScheduleAction(action: ChatAction): Promise<any> {
    // Implement schedule reminder action
    return { success: true, message: 'Schedule action executed' };
  }



  private getDefaultConfig(): ChatbotConfig {
    return {
      defaultMode: 'standard',
      standardModel: 'gpt-3.5-turbo',
      smarterModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompts: {
        standard: 'You are a helpful email assistant. Help users manage their emails efficiently with clear, concise responses.',
        smarter: 'You are an advanced AI email assistant with deep understanding of email patterns, workflows, and automation. Provide intelligent insights and proactive suggestions.'
      }
    };
  }

  // Helper methods
  private generateConversationTitle(message: string): string {
    // Extract first few words or use default
    const words = message.split(' ').slice(0, 5).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  private extractEmailSnippet(email: Email): string {
    const text = email.body.text || email.body.html?.replace(/<[^>]*>/g, '') || '';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  private async extractActions(responseText: string, emailContext?: EmailContext): Promise<ChatAction[]> {
    const actions: ChatAction[] = [];
    
    // Simple pattern matching for action extraction
    const actionPatterns = [
      { type: 'compose', regex: /compose|write|create|draft|new email/i },
      { type: 'reply', regex: /reply|respond|answer/i },
      { type: 'forward', regex: /forward|send to|share with/i },
      { type: 'archive', regex: /archive|file|store/i },
      { type: 'delete', regex: /delete|remove|trash/i },
      { type: 'search', regex: /search|find|look for/i },
      { type: 'schedule', regex: /schedule|remind|calendar|later/i }
    ];
    
    // Check for action patterns in the response
    for (const pattern of actionPatterns) {
      if (pattern.regex.test(responseText)) {
        actions.push({
          id: uuidv4(),
          type: pattern.type as any,
          label: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}`,
          description: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} related to this conversation`,
          payload: emailContext ? { emailContext } : undefined
        });
      }
    }
    
    return actions;
  }

  private async generateEmailContextSummary(emails: Email[]): Promise<string> {
    if (emails.length === 0) return 'No emails';
    if (emails.length === 1) return `1 email: ${emails[0].subject}`;
    
    const count = emails.length;
    const latestDate = new Date(Math.max(...emails.map(e => new Date(e.date).getTime())));
    const senders = [...new Set(emails.map(e => e.from.name || e.from.address))].slice(0, 3);
    
    let summary = `${count} email${count > 1 ? 's' : ''}`;
    
    if (senders.length > 0) {
      summary += ` from ${senders.join(', ')}`;
      if (senders.length < count) summary += ` and others`;
    }
    
    summary += `. Latest from ${latestDate.toLocaleDateString()}.`;
    
    // Add thread info if available
    const threads = this.groupEmailsByThread(emails);
    if (Object.keys(threads).length > 1) {
      summary += ` ${Object.keys(threads).length} conversation threads.`;
    }
    
    // Use AI to generate better summary
    try {
      const aiSummary = await this.aiService.generateResponse({
        prompt: `Summarize these ${count} emails concisely: ${emails.map(e => e.subject).join(', ')}`,
        model: 'gpt-3.5-turbo',
        maxTokens: 100
      });
      summary += `\nAI Summary: ${aiSummary.text}`;
    } catch (error) {
      logger.error('Failed to generate AI summary:', error);
    }
    
    return summary;
  }
  
  private groupEmailsByThread(emails: Email[]): Record<string, Email[]> {
    const threads: Record<string, Email[]> = {};
    
    for (const email of emails) {
      const threadId = email.threadId || email.id;
      if (!threads[threadId]) {
        threads[threadId] = [];
      }
      threads[threadId].push(email);
    }
    
    return threads;
  }

  private groupEmailsByThread(emails: Email[]): { [threadId: string]: Email[] } {
    const threads: { [threadId: string]: Email[] } = {};
    
    emails.forEach(email => {
      const threadId = email.threadId || email.id;
      if (!threads[threadId]) {
        threads[threadId] = [];
      }
      threads[threadId].push(email);
    });
    
    return threads;
  }

  private buildSystemPrompt(mode: ChatMode, emailContext?: EmailContext): string {
    let prompt = `You are an intelligent email assistant. You help users manage their emails efficiently.\n\n`;
    
    if (mode === 'smarter') {
      prompt += `You are in SMARTER mode - provide detailed analysis, suggestions, and proactive recommendations. Use advanced reasoning and consider context deeply.\n\n`;
    } else {
      prompt += `You are in STANDARD mode - provide helpful but concise responses focused on the immediate request.\n\n`;
    }
    
    prompt += `Use the provided conversation summary, relevant past summaries, and email context to maintain awareness of the conversation history and long-term memory. Reference them appropriately in your responses.\n\n`;
    
    prompt += `Available actions: compose, reply, forward, archive, delete, search, schedule\n`;
    
    if (emailContext && emailContext.emails.length > 0) {
      prompt += `\nCurrent email context: ${emailContext.summary}\n`;
    }
    
    prompt += `\nAlways be helpful, accurate, and respect user privacy. When suggesting actions, be specific about what you can help with.`;
    
    return prompt;
  }

  private getActionLabel(actionType: string): string {
    const labels: { [key: string]: string } = {
      compose: 'Compose Email',
      reply: 'Reply to Email',
      forward: 'Forward Email',
      archive: 'Archive Email',
      delete: 'Delete Email',
      search: 'Search Emails',
      schedule: 'Schedule Reminder'
    };
    
    return labels[actionType] || actionType;
  }

  private extractActionData(actionType: string, message: string, emailContext?: EmailContext): any {
    // Extract relevant data based on action type and message content
    const data: any = {};
    
    if (emailContext && emailContext.emails.length > 0) {
      data.emailId = emailContext.emails[0].id;
    }
    
    // Add more sophisticated extraction logic here
    return data;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  get isReady(): boolean {
    return this.isInitialized;
  }
}