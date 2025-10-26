/**
 * AI service types and interfaces for email processing
 */

import { Email, EmailContext, EmailComposition, ActionItem, EmailCategory, EmailPriority } from './email'

export interface AIService {
  summarizeEmail(email: Email, options?: SummarizationOptions): Promise<string>
  composeReply(context: EmailContext, options?: CompositionOptions): Promise<string>
  categorizeEmail(email: Email, options?: CategorizationOptions): Promise<EmailCategory>
  extractActionItems(email: Email, options?: ExtractionOptions): Promise<ActionItem[]>
  generateDraft(prompt: string, context?: EmailContext, options?: CompositionOptions): Promise<string>
  analyzeSentiment(email: Email): Promise<SentimentResult>
  generateSubject(body: string, context?: EmailContext): Promise<string>
  improveWriting(text: string, options?: ImprovementOptions): Promise<string>
  translate(text: string, targetLanguage: string): Promise<string>
  detectLanguage(text: string): Promise<string>
  generateSmartReply(email: Email, options?: SmartReplyOptions): Promise<string[]>
}

export interface SummarizationOptions {
  maxLength?: number
  style?: 'brief' | 'detailed' | 'bullet-points'
  includeActionItems?: boolean
  language?: string
}

export interface CompositionOptions {
  tone?: 'formal' | 'casual' | 'friendly' | 'professional'
  length?: 'short' | 'medium' | 'long'
  includeGreeting?: boolean
  includeClosing?: boolean
  language?: string
  urgency?: 'low' | 'normal' | 'high'
}

export interface CategorizationOptions {
  confidence?: number
  customCategories?: string[]
  useHistory?: boolean
}

export interface ExtractionOptions {
  includeDeadlines?: boolean
  priorityThreshold?: number
  confidence?: number
}

export interface ImprovementOptions {
  type?: 'grammar' | 'clarity' | 'tone' | 'conciseness' | 'all'
  targetTone?: 'formal' | 'casual' | 'friendly' | 'professional'
  preserveLength?: boolean
}

export interface SmartReplyOptions {
  count?: number
  maxLength?: number
  tone?: 'formal' | 'casual' | 'friendly' | 'professional'
  includeQuestions?: boolean
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  emotions?: string[]
  urgency?: 'low' | 'normal' | 'high'
}

export interface AIRequest {
  id: string
  type: AIRequestType
  email?: Email
  context?: EmailContext
  prompt?: string
  options?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: any
  error?: string
  provider: string
  model: string
  tokensUsed?: number
  cost?: number
}

export type AIRequestType = 
  | 'summarize'
  | 'compose'
  | 'compose_reply'
  | 'generate_draft'
  | 'categorize'
  | 'extract_actions'
  | 'sentiment'
  | 'generate_subject'
  | 'improve_writing'
  | 'translate'
  | 'detect_language'
  | 'smart_reply'

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  tokensUsed?: number
  provider: string
  model: string
  processingTime: number
  cached?: boolean
}

export interface AICache {
  id: string
  emailId: string
  requestType: AIRequestType
  requestHash: string
  result: any
  confidence: number
  provider: string
  model: string
  createdAt: Date
  expiresAt: Date
  hitCount: number
  lastUsed: Date
}

export interface AIUsage {
  id: string
  provider: string
  model: string
  requestType: AIRequestType
  tokensUsed: number
  cost: number
  date: Date
  success: boolean
  processingTime: number
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'azure-openai' | 'google-palm'
  apiKey?: string
  endpoint?: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number
  retries: number
  fallbackProvider?: string
}

export interface LocalAIConfig {
  enabled: boolean
  modelPath: string
  model: string
  maxTokens: number
  temperature: number
  contextLength: number
  threads: number
  gpuLayers: number
}

export interface AIModelInfo {
  id: string
  name: string
  provider: string
  description: string
  contextLength: number
  maxTokens: number
  pricing?: {
    input: number // per 1K tokens
    output: number // per 1K tokens
  }
  features: AICapabilities
  status: 'available' | 'deprecated' | 'beta'
}

export interface AICapabilities {
  summarization: boolean
  composition: boolean
  categorization: boolean
  actionExtraction: boolean
  sentimentAnalysis: boolean
  translation: boolean
  smartReply: boolean
  imageAnalysis: boolean
  codeGeneration: boolean
}

export interface AIBatch {
  id: string
  emails: string[]
  requestType: AIRequestType
  options?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  results: Record<string, any>
  errors: Record<string, string>
  provider: string
  model: string
  totalTokens: number
  totalCost: number
}

export interface AIStatistics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokensUsed: number
  totalCost: number
  averageProcessingTime: number
  requestsByType: Record<AIRequestType, number>
  requestsByProvider: Record<string, number>
  cacheHitRate: number
  lastUpdated: Date
}