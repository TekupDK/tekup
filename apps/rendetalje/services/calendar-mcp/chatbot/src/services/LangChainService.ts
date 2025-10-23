/**
 * LangChain Service for RenOS Calendar AI
 * Provides intelligent conversation handling with memory and tool integration
 * NOTE: Simplified version without advanced LangChain features (requires Node 20+)
 */

import { ChatOpenAI } from '@langchain/openai';
import { MCPTool } from '../types/plugin';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class LangChainService {
  private llm: ChatOpenAI | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private mcpTools: Map<string, MCPTool> = new Map();
  private isConfigured: boolean = false;

  constructor() {
    // Simple memory implementation
  }

  /**
   * Initialize LangChain with API key
   */
  public configure(openaiApiKey: string): void {
    try {
      this.llm = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.7,
        openAIApiKey: openaiApiKey,
      });
      this.isConfigured = true;
      console.log('LangChain configured successfully');
    } catch (error) {
      console.error('Failed to configure LangChain:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Register MCP tools for LangChain agent
   */
  public registerMCPTools(tools: MCPTool[]): void {
    tools.forEach(tool => {
      this.mcpTools.set(tool.name, tool);
    });
    console.log(`Registered ${tools.length} MCP tools with LangChain`);
  }

  /**
   * Process user input with LangChain
   */
  public async processMessage(userInput: string): Promise<string> {
    if (!this.isConfigured || !this.llm) {
      return this.fallbackResponse(userInput);
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      });

      // Simple conversation (without advanced LangChain features)
      const response = await this.simpleConversation(userInput);
      
      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      return response;
    } catch (error) {
      console.error('LangChain processing error:', error);
      return this.fallbackResponse(userInput);
    }
  }

  /**
   * Simple conversation without tools
   */
  private async simpleConversation(userInput: string): Promise<string> {
    if (!this.llm) {
      return this.fallbackResponse(userInput);
    }

    try {
      // Build conversation context from history
      const context = this.conversationHistory.slice(-5)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Add system prompt with context
      const prompt = `Du er RenOS Calendar AI Assistant. Du hjælper med booking validering, konflikt check, faktura oprettelse, overtid tracking og kunde intelligence.

${context ? `Samtale historik:\n${context}\n` : ''}
User: ${userInput}
Assistant:`;

      // Call OpenAI API (simplified)
      const response = await this.llm.invoke(prompt);
      
      return response.content ? response.content.toString() : 'Jeg kunne ikke generere et svar.';
    } catch (error) {
      console.error('Simple conversation error:', error);
      return this.fallbackResponse(userInput);
    }
  }

  /**
   * Fallback response when LangChain is not configured
   */
  private fallbackResponse(userInput: string): string {
    const lowerInput = userInput.toLowerCase();

    // Simple pattern matching for common queries
    if (lowerInput.includes('valider') || lowerInput.includes('booking')) {
      return 'For at validere en booking, brug formatet: "Valider booking 2025-10-21 tirsdag for [kunde]"';
    }

    if (lowerInput.includes('konflikt')) {
      return 'For at tjekke konflikter, brug formatet: "Tjek konflikter fra 09:00 til 12:00"';
    }

    if (lowerInput.includes('faktura') || lowerInput.includes('invoice')) {
      return 'For at oprette en faktura, brug formatet: "Opret faktura for booking [ID]"';
    }

    if (lowerInput.includes('overtid') || lowerInput.includes('overtime')) {
      return 'For at tracke overtid, brug formatet: "Track overtid for booking [ID]"';
    }

    if (lowerInput.includes('kunde') || lowerInput.includes('customer')) {
      return 'For at hente kunde information, brug formatet: "Hent kunde info for [navn]"';
    }

    return 'Jeg forstår ikke helt din forespørgsel. Prøv at omformulere, eller vælg et værktøj fra menuen.';
  }

  /**
   * Clear conversation memory
   */
  public clearMemory(): void {
    this.conversationHistory = [];
    console.log('Conversation memory cleared');
  }

  /**
   * Get conversation history
   */
  public async getHistory(): Promise<ConversationMessage[]> {
    return this.conversationHistory;
  }

  /**
   * Check if LangChain is configured
   */
  public get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get registered tools count
   */
  public get toolsCount(): number {
    return this.mcpTools.size;
  }
}

// Singleton instance
export const langChainService = new LangChainService();

