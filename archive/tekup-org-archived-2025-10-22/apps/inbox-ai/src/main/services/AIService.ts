/**
 * TekUp Secure Platform - AI Service Module
 * Provides AI-powered email processing and lead enhancement
 */

import { EventEmitter } from 'events'
import { LogService } from './LogService'
import { ConfigurationServiceImpl } from './ConfigurationService'
import { AppDatabase } from '../database/Database'
import { Email, AIProvider } from '@shared/types'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export interface AIConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface EmailSummary {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  urgency: 'low' | 'medium' | 'high'
}

export interface LeadEnhancement {
  extractedData: Record<string, any>
  confidence: number
  suggestedCategory: string
  priority: number
  nextActions: string[]
}

export class AIService extends EventEmitter {
  private log: LogService
  private config: ConfigurationServiceImpl
  private database: AppDatabase
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private currentProvider: 'openai' | 'anthropic' = 'openai'
  private isInitialized = false
  private usageCache = new Map<string, any>()

  constructor(database: AppDatabase, config: ConfigurationServiceImpl) {
    super()
    this.database = database
    this.config = config
    this.log = new LogService()
  }

  /**
   * Initialize AI service with providers
   */
  async initialize(): Promise<void> {
    try {
      this.log.info('Initializing TekUp AI Service')
      
      // Load AI providers from config
      const providers = await this.config.getAIProviders()
      
      for (const provider of providers) {
        await this.initializeProvider(provider)
      }
      
      this.isInitialized = true
      this.log.info('AI Service initialized successfully')
      this.emit('initialized')
      
    } catch (error) {
      this.log.error('Failed to initialize AI Service', error as Error)
      throw error
    }
  }

  /**
   * Initialize specific AI provider
   */
  private async initializeProvider(provider: AIProvider): Promise<void> {
    try {
      if (provider.type === 'openai' && provider.apiKey) {
        this.openai = new OpenAI({ apiKey: provider.apiKey })
        this.log.info('OpenAI provider initialized')
      } else if (provider.type === 'anthropic' && provider.apiKey) {
        this.anthropic = new Anthropic({ apiKey: provider.apiKey })
        this.log.info('Anthropic provider initialized')
      }
    } catch (error) {
      this.log.error(`Failed to initialize ${provider.type} provider`, error as Error)
    }
  }

  /**
   * Summarize email content
   */
  async summarizeEmail(email: Email): Promise<string> {
    try {
      this.log.debug('Summarizing email', { emailId: email.id })
      
      // Check cache first
      const cacheKey = `summary_${email.id}`
      if (this.usageCache.has(cacheKey)) {
        return this.usageCache.get(cacheKey)
      }
      
      const prompt = this.buildSummaryPrompt(email)
      const summary = await this.callAI(prompt, { maxTokens: 150 })
      
      // Cache result
      this.usageCache.set(cacheKey, summary)
      
      // Store in database
      await this.storeAIResult(email.id, 'summary', summary)
      
      return summary
      
    } catch (error) {
      this.log.error('Email summarization failed', error as Error)
      return 'Summarization unavailable'
    }
  }

  /**
   * Compose reply using AI
   */
  async composeReply(context: { originalEmail: Email, replyType: 'professional' | 'friendly' | 'brief', customInstructions?: string }): Promise<string> {
    try {
      this.log.debug('Composing AI reply', { emailId: context.originalEmail.id, type: context.replyType })
      
      const prompt = this.buildReplyPrompt(context)
      const reply = await this.callAI(prompt, { maxTokens: 300 })
      
      await this.storeAIResult(context.originalEmail.id, 'reply', reply)
      
      return reply
      
    } catch (error) {
      this.log.error('Reply composition failed', error as Error)
      throw error
    }
  }

  /**
   * Categorize email for lead processing
   */
  async categorizeEmail(email: Email): Promise<{ category: string, confidence: number, reasoning: string }> {
    try {
      this.log.debug('Categorizing email', { emailId: email.id })
      
      const cacheKey = `category_${email.id}`
      if (this.usageCache.has(cacheKey)) {
        return this.usageCache.get(cacheKey)
      }
      
      const prompt = this.buildCategorizationPrompt(email)
      const response = await this.callAI(prompt, { maxTokens: 200 })
      
      const result = this.parseCategorizationResponse(response)
      this.usageCache.set(cacheKey, result)
      
      await this.storeAIResult(email.id, 'categorization', result)
      
      return result
      
    } catch (error) {
      this.log.error('Email categorization failed', error as Error)
      return { category: 'unknown', confidence: 0, reasoning: 'Categorization failed' }
    }
  }

  /**
   * Generate draft email
   */
  async generateDraft(prompt: string, context?: { recipient?: string, tone?: string, purpose?: string }): Promise<string> {
    try {
      this.log.debug('Generating email draft', { hasContext: !!context })
      
      const fullPrompt = this.buildDraftPrompt(prompt, context)
      const draft = await this.callAI(fullPrompt, { maxTokens: 400 })
      
      return draft
      
    } catch (error) {
      this.log.error('Draft generation failed', error as Error)
      throw error
    }
  }

  /**
   * Extract action items from email
   */
  async extractActionItems(email: Email): Promise<string[]> {
    try {
      this.log.debug('Extracting action items', { emailId: email.id })
      
      const cacheKey = `actions_${email.id}`
      if (this.usageCache.has(cacheKey)) {
        return this.usageCache.get(cacheKey)
      }
      
      const prompt = this.buildActionItemsPrompt(email)
      const response = await this.callAI(prompt, { maxTokens: 200 })
      
      const actionItems = this.parseActionItems(response)
      this.usageCache.set(cacheKey, actionItems)
      
      await this.storeAIResult(email.id, 'action_items', actionItems)
      
      return actionItems
      
    } catch (error) {
      this.log.error('Action item extraction failed', error as Error)
      return []
    }
  }

  /**
   * Extract lead information from email
   */
  async extractLead(emailId: string): Promise<any> {
    try {
      this.log.debug('Extracting lead from email', { emailId })
      
      // Get email from database first
      const stmt = this.database.prepare('SELECT * FROM emails WHERE id = ?')
      const emailRow = stmt.get(emailId) as any
      
      if (!emailRow) {
        throw new Error(`Email not found: ${emailId}`)
      }
      
      const email: Email = {
        id: emailRow.id,
        accountId: emailRow.account_id,
        messageId: emailRow.message_id || emailRow.id,
        subject: emailRow.subject,
        fromAddress: emailRow.from_address || '',
        toAddress: emailRow.to_address,
        body: { text: emailRow.body },
        receivedAt: new Date(emailRow.received_at),
        isRead: Boolean(emailRow.is_read),
        folder: emailRow.folder || 'INBOX'
      }
      
      const prompt = this.buildLeadExtractionPrompt(email)
      const response = await this.callAI(prompt, { maxTokens: 400 })
      
      const leadData = this.parseLeadExtraction(response)
      
      await this.storeAIResult(emailId, 'lead_extraction', leadData)
      
      return leadData
      
    } catch (error) {
      this.log.error('Lead extraction failed', error as Error)
      return null
    }
  }

  /**
   * Enhance lead data with AI analysis
   */
  async enhanceLead(email: Email, extractedData: Record<string, any>): Promise<LeadEnhancement> {
    try {
      this.log.debug('Enhancing lead with AI', { emailId: email.id })
      
      const prompt = this.buildLeadEnhancementPrompt(email, extractedData)
      const response = await this.callAI(prompt, { maxTokens: 300 })
      
      const enhancement = this.parseLeadEnhancement(response, extractedData)
      
      await this.storeAIResult(email.id, 'lead_enhancement', enhancement)
      
      return enhancement
      
    } catch (error) {
      this.log.error('Lead enhancement failed', error as Error)
      return {
        extractedData,
        confidence: 0,
        suggestedCategory: 'unknown',
        priority: 1,
        nextActions: []
      }
    }
  }

  /**
   * Get AI service status
   */
  async getStatus(): Promise<{ providers: any[], usage: any, isHealthy: boolean }> {
    try {
      const providers = []
      
      if (this.openai) {
        providers.push({ type: 'openai', status: 'active' })
      }
      
      if (this.anthropic) {
        providers.push({ type: 'anthropic', status: 'active' })
      }
      
      const usage = {
        cacheSize: this.usageCache.size,
        currentProvider: this.currentProvider
      }
      
      return {
        providers,
        usage,
        isHealthy: providers.length > 0
      }
      
    } catch (error) {
      this.log.error('Failed to get AI status', error as Error)
      throw error
    }
  }

  /**
   * Switch AI provider
   */
  async switchProvider(providerId: string): Promise<boolean> {
    try {
      if (providerId === 'openai' && this.openai) {
        this.currentProvider = 'openai'
        this.log.info('Switched to OpenAI provider')
        return true
      } else if (providerId === 'anthropic' && this.anthropic) {
        this.currentProvider = 'anthropic'
        this.log.info('Switched to Anthropic provider')
        return true
      }
      
      throw new Error(`Provider ${providerId} not available`)
      
    } catch (error) {
      this.log.error('Failed to switch AI provider', error as Error)
      return false
    }
  }

  /**
   * Call AI provider with prompt
   */
  private async callAI(prompt: string, options: { maxTokens?: number, temperature?: number } = {}): Promise<string> {
    try {
      if (this.currentProvider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 200,
          temperature: options.temperature || 0.7
        })
        
        return response.choices[0]?.message?.content || 'No response generated'
        
      } else if (this.currentProvider === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 200,
          messages: [{ role: 'user', content: prompt }]
        })
        
        return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated'
      }
      
      throw new Error('No AI provider available')
      
    } catch (error) {
      this.log.error('AI API call failed', error as Error)
      throw error
    }
  }

  /**
   * Build summary prompt
   */
  private buildSummaryPrompt(email: Email): string {
    return `Summarize this email in 2-3 sentences, focusing on key information and any action items:

Subject: ${email.subject}
From: ${email.fromAddress}
Content: ${typeof email.body === 'string' ? email.body.substring(0, 1000) : (email.body.text || email.body.html || '').substring(0, 1000)}

Summary:`
  }

  /**
   * Build reply prompt
   */
  private buildReplyPrompt(context: { originalEmail: Email, replyType: string, customInstructions?: string }): string {
    const toneInstructions = {
      professional: 'Write a professional and courteous reply',
      friendly: 'Write a warm and friendly reply',
      brief: 'Write a brief and to-the-point reply'
    }
    
    return `${toneInstructions[context.replyType as keyof typeof toneInstructions] || 'Write a professional reply'} to this email:

Subject: ${context.originalEmail.subject}
From: ${context.originalEmail.fromAddress}
Content: ${typeof context.originalEmail.body === 'string' ? context.originalEmail.body.substring(0, 800) : (context.originalEmail.body.text || context.originalEmail.body.html || '').substring(0, 800)}

${context.customInstructions ? `Additional instructions: ${context.customInstructions}` : ''}

Reply:`
  }

  /**
   * Build categorization prompt
   */
  private buildCategorizationPrompt(email: Email): string {
    return `Categorize this email as one of: lead, customer_service, internal, spam, or other.
Also provide confidence (0-100) and brief reasoning.

Subject: ${email.subject}
From: ${email.fromAddress}
Content: ${typeof email.body === 'string' ? email.body.substring(0, 500) : (email.body.text || email.body.html || '').substring(0, 500)}

Format: Category: [category] | Confidence: [0-100] | Reasoning: [brief explanation]`
  }

  /**
   * Build draft prompt
   */
  private buildDraftPrompt(prompt: string, context?: any): string {
    let fullPrompt = `Write a professional email based on this request: ${prompt}`
    
    if (context?.recipient) {
      fullPrompt += `\nRecipient: ${context.recipient}`
    }
    
    if (context?.tone) {
      fullPrompt += `\nTone: ${context.tone}`
    }
    
    if (context?.purpose) {
      fullPrompt += `\nPurpose: ${context.purpose}`
    }
    
    fullPrompt += '\n\nEmail:'
    
    return fullPrompt
  }

  /**
   * Build action items prompt
   */
  private buildActionItemsPrompt(email: Email): string {
    return `Extract action items from this email. List each action item on a new line:

Subject: ${email.subject}
Content: ${typeof email.body === 'string' ? email.body.substring(0, 800) : (email.body.text || email.body.html || '').substring(0, 800)}

Action items:`
  }

  /**
   * Build lead extraction prompt
   */
  private buildLeadExtractionPrompt(email: Email): string {
    const bodyText = typeof email.body === 'string' ? email.body : (email.body.text || email.body.html || '')
    return `Extract lead information from this email:

Subject: ${email.subject}
From: ${email.fromAddress}
Content: ${bodyText.substring(0, 800)}

Extract:
1. Company name
2. Contact person
3. Phone number
4. Email address
5. Service interest
6. Location
7. Budget indication

Format as JSON.`
  }

  /**
   * Parse lead extraction response
   */
  private parseLeadExtraction(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        company: 'Unknown',
        contact: 'Unknown',
        phone: null,
        email: null,
        service: 'Unknown',
        location: null,
        budget: null
      }
    }
  }

  /**
   * Build lead enhancement prompt
   */
  private buildLeadEnhancementPrompt(email: Email, extractedData: Record<string, any>): string {
    const bodyText = typeof email.body === 'string' ? email.body : (email.body.text || email.body.html || '')
    return `Analyze this lead email and enhance the extracted data:

Email Subject: ${email.subject}
Email Content: ${bodyText.substring(0, 600)}
Extracted Data: ${JSON.stringify(extractedData)}

Provide:
1. Confidence score (0-100) for the lead quality
2. Suggested category (cleaning, catering, security, other)
3. Priority level (1-5, where 5 is highest)
4. Next actions (list 2-3 recommended actions)

Format as JSON.`
  }

  /**
   * Parse categorization response
   */
  private parseCategorizationResponse(response: string): { category: string, confidence: number, reasoning: string } {
    try {
      const categoryMatch = response.match(/Category:\s*(\w+)/i)
      const confidenceMatch = response.match(/Confidence:\s*(\d+)/i)
      const reasoningMatch = response.match(/Reasoning:\s*(.+)/i)
      
      return {
        category: categoryMatch?.[1] || 'unknown',
        confidence: parseInt(confidenceMatch?.[1] || '0'),
        reasoning: reasoningMatch?.[1] || 'No reasoning provided'
      }
    } catch (error) {
      return { category: 'unknown', confidence: 0, reasoning: 'Parse error' }
    }
  }

  /**
   * Parse action items from response
   */
  private parseActionItems(response: string): string[] {
    return response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.toLowerCase().includes('action items'))
      .slice(0, 5) // Limit to 5 action items
  }

  /**
   * Parse lead enhancement response
   */
  private parseLeadEnhancement(response: string, originalData: Record<string, any>): LeadEnhancement {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response)
      
      return {
        extractedData: originalData,
        confidence: parsed.confidence || 0,
        suggestedCategory: parsed.category || 'unknown',
        priority: parsed.priority || 1,
        nextActions: parsed.nextActions || []
      }
    } catch (error) {
      // Fallback to text parsing
      return {
        extractedData: originalData,
        confidence: 50,
        suggestedCategory: 'unknown',
        priority: 1,
        nextActions: ['Review manually', 'Contact customer']
      }
    }
  }

  /**
   * Store AI result in database
   */
  private async storeAIResult(emailId: string, type: string, result: any): Promise<void> {
    try {
      const stmt = this.database.prepare(`
        INSERT OR REPLACE INTO ai_cache 
        (email_id, type, result, created_at)
        VALUES (?, ?, ?, ?)
      `)
      
      stmt.run(emailId, type, JSON.stringify(result), new Date().toISOString())
      
    } catch (error) {
      this.log.warn('Failed to store AI result', error as Error)
    }
  }

  /**
   * Shutdown AI service
   */
  async shutdown(): Promise<void> {
    try {
      this.log.info('Shutting down AI Service')
      
      // Clear cache
      this.usageCache.clear()
      
      this.emit('shutdown')
      
    } catch (error) {
      this.log.error('AI Service shutdown failed', error as Error)
      throw error
    }
  }
}
