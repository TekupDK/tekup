/**
 * Validation service for settings and configuration with error handling
 */

import { 
  IMAPConfig, 
  AIProvider, 
  AppSettings, 
  AppError,
  EmailProvider 
} from '@shared/types'
import { 
  IMAPConfigSchema, 
  AIProviderSchema, 
  AppSettingsSchema,
  CreateIMAPConfigSchema,
  CreateAIProviderSchema 
} from '@shared/validators'
import { EMAIL_PROVIDERS, AI_PROVIDERS, ERROR_CODES } from '@shared/constants'
import { LogService } from './LogService.js'
import { ZodError } from 'zod'

export class ValidationService {
  private log: LogService

  constructor() {
    this.log = new LogService()
  }

  /**
   * Validate IMAP configuration
   */
  validateIMAPConfig(config: any): { isValid: boolean; errors: string[]; data?: IMAPConfig } {
    try {
      const validatedConfig = CreateIMAPConfigSchema.parse(config)
      
      // Additional business logic validation
      const errors: string[] = []
      
      // Check if provider is supported
      if (!EMAIL_PROVIDERS[validatedConfig.provider as keyof typeof EMAIL_PROVIDERS]) {
        errors.push(`Unsupported email provider: ${validatedConfig.provider}`)
      }
      
      // Validate port ranges
      if (validatedConfig.port < 1 || validatedConfig.port > 65535) {
        errors.push('Port must be between 1 and 65535')
      }
      
      // Check for common misconfigurations
      if (validatedConfig.provider === 'gmail' && validatedConfig.host !== 'imap.gmail.com') {
        errors.push('Gmail IMAP host should be imap.gmail.com')
      }
      
      if (validatedConfig.provider === 'outlook' && !validatedConfig.host.includes('outlook.office365.com')) {
        errors.push('Outlook IMAP host should be outlook.office365.com')
      }
      
      // Validate SSL/TLS settings
      if (validatedConfig.secure && validatedConfig.port === 143) {
        errors.push('Port 143 is typically used for non-secure IMAP. Consider using port 993 for secure connections.')
      }
      
      if (!validatedConfig.secure && validatedConfig.port === 993) {
        errors.push('Port 993 is typically used for secure IMAP. Enable secure connection or use port 143.')
      }

      const finalConfig: IMAPConfig = {
        ...validatedConfig,
        id: config.id || crypto.randomUUID(),
        createdAt: config.createdAt || new Date(),
        updatedAt: new Date(),
        lastSyncAt: config.lastSyncAt,
      }

      return {
        isValid: errors.length === 0,
        errors,
        data: finalConfig
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        return { isValid: false, errors }
      }
      
      this.log.error('IMAP config validation failed', error as Error)
      return { 
        isValid: false, 
        errors: ['Invalid configuration format'] 
      }
    }
  }

  /**
   * Validate AI provider configuration
   */
  validateAIProvider(provider: any): { isValid: boolean; errors: string[]; data?: AIProvider } {
    try {
      const validatedProvider = CreateAIProviderSchema.parse(provider)
      
      const errors: string[] = []
      
      // Check if provider is supported
      if (!AI_PROVIDERS[validatedProvider.name as keyof typeof AI_PROVIDERS]) {
        errors.push(`Unsupported AI provider: ${validatedProvider.name}`)
      }
      
      // Validate provider-specific requirements
      const providerConfig = AI_PROVIDERS[validatedProvider.name as keyof typeof AI_PROVIDERS]
      
      if (providerConfig) {
        // Check if model is supported
        const supportedModels = providerConfig.models as readonly string[]
        if (!supportedModels.includes(validatedProvider.model)) {
          errors.push(`Model ${validatedProvider.model} is not supported by ${validatedProvider.name}`)
        }
        
        // Check API key requirement
        if (validatedProvider.name !== 'local' && !validatedProvider.apiKey) {
          errors.push('API key is required for this provider')
        }
        
        // Check endpoint requirement for Azure OpenAI
        if (validatedProvider.name === 'azure-openai' && !validatedProvider.endpoint) {
          errors.push('Endpoint URL is required for Azure OpenAI')
        }
      }
      
      // Validate token limits
      if (validatedProvider.maxTokens > 100000) {
        errors.push('Maximum tokens cannot exceed 100,000')
      }
      
      // Validate temperature range
      if (validatedProvider.temperature < 0 || validatedProvider.temperature > 2) {
        errors.push('Temperature must be between 0 and 2')
      }

      const finalProvider: AIProvider = {
        ...validatedProvider,
        id: provider.id || crypto.randomUUID(),
        type: provider.type || validatedProvider.name,
        isDefault: provider.isDefault || false,
        createdAt: provider.createdAt || new Date(),
        updatedAt: new Date(),
      }

      return {
        isValid: errors.length === 0,
        errors,
        data: finalProvider
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        return { isValid: false, errors }
      }
      
      this.log.error('AI provider validation failed', error as Error)
      return { 
        isValid: false, 
        errors: ['Invalid provider configuration'] 
      }
    }
  }

  /**
   * Validate application settings
   */
  validateAppSettings(settings: any): { isValid: boolean; errors: string[]; data?: AppSettings } {
    try {
      // Create a copy with timestamps for validation
      const settingsWithTimestamps = {
        ...settings,
        createdAt: settings.createdAt || new Date(),
        updatedAt: new Date(),
      }
      
      const validatedSettings = AppSettingsSchema.parse(settingsWithTimestamps)
      
      const errors: string[] = []
      
      // Validate sync interval
      if (validatedSettings.syncInterval < 1 || validatedSettings.syncInterval > 1440) {
        errors.push('Sync interval must be between 1 and 1440 minutes')
      }
      
      // Validate cache size
      if (validatedSettings.cacheSize < 10 || validatedSettings.cacheSize > 1000) {
        errors.push('Cache size must be between 10 and 1000 MB')
      }
      
      // Validate emails per page
      if (validatedSettings.emailsPerPage < 10 || validatedSettings.emailsPerPage > 500) {
        errors.push('Emails per page must be between 10 and 500')
      }
      
      // Validate data retention
      if (validatedSettings.dataRetentionDays < 1 || validatedSettings.dataRetentionDays > 3650) {
        errors.push('Data retention must be between 1 and 3650 days')
      }

      return {
        isValid: errors.length === 0,
        errors,
        data: validatedSettings
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        return { isValid: false, errors }
      }
      
      this.log.error('App settings validation failed', error as Error)
      return { 
        isValid: false, 
        errors: ['Invalid settings format'] 
      }
    }
  }

  /**
   * Validate email object
   */
  validateEmail(email: any): { isValid: boolean; errors: string[]; data?: any } {
    const errors: string[] = []
    
    if (!email) {
      return { isValid: false, errors: ['Email is required'] }
    }
    
    if (!email.id) errors.push('Email ID is required')
    if (!email.subject) errors.push('Email subject is required')
    if (!email.from || !email.from.email) errors.push('Email sender is required')
    if (!email.to || !Array.isArray(email.to) || email.to.length === 0) {
      errors.push('Email recipients are required')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: email
    }
  }

  /**
   * Validate AI compose context
   */
  validateAIComposeContext(context: any): { isValid: boolean; errors: string[]; data?: any } {
    const errors: string[] = []
    
    if (!context) {
      return { isValid: false, errors: ['Context is required'] }
    }
    
    if (!context.type || !['reply', 'reply_all', 'forward', 'new'].includes(context.type)) {
      errors.push('Valid context type is required (reply, reply_all, forward, new)')
    }
    
    if (context.type !== 'new' && !context.originalEmail) {
      errors.push('Original email is required for reply/forward operations')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: context
    }
  }

  /**
   * Validate email address format
   */
  validateEmailAddress(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email) {
      return { isValid: false, error: 'Email address is required' }
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email address format' }
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'Email address is too long' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate URL format
   */
  validateURL(url: string): { isValid: boolean; error?: string } {
    if (!url) {
      return { isValid: false, error: 'URL is required' }
    }
    
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Invalid URL format' }
    }
  }

  /**
   * Validate hostname
   */
  validateHostname(hostname: string): { isValid: boolean; error?: string } {
    if (!hostname) {
      return { isValid: false, error: 'Hostname is required' }
    }
    
    // Basic hostname validation
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!hostnameRegex.test(hostname)) {
      return { isValid: false, error: 'Invalid hostname format' }
    }
    
    if (hostname.length > 253) {
      return { isValid: false, error: 'Hostname is too long' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate port number
   */
  validatePort(port: number): { isValid: boolean; error?: string } {
    if (!port) {
      return { isValid: false, error: 'Port is required' }
    }
    
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { isValid: false, error: 'Port must be an integer between 1 and 65535' }
    }
    
    return { isValid: true }
  }

  /**
   * Auto-configure IMAP settings based on email provider
   */
  autoConfigureIMAP(emailAddress: string): Partial<IMAPConfig> | null {
    const domain = emailAddress.split('@')[1]?.toLowerCase()
    
    if (!domain) {
      return null
    }
    
    // Gmail and Google Workspace
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return {
        provider: 'gmail',
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        authMethod: 'oauth2',
      }
    }
    
    // Outlook/Hotmail/Live
    if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
      return {
        provider: 'outlook',
        host: 'outlook.office365.com',
        port: 993,
        secure: true,
        authMethod: 'oauth2',
      }
    }
    
    // Yahoo
    if (domain === 'yahoo.com') {
      return {
        provider: 'yahoo',
        host: 'imap.mail.yahoo.com',
        port: 993,
        secure: true,
        authMethod: 'plain',
      }
    }
    
    // iCloud
    if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) {
      return {
        provider: 'icloud',
        host: 'imap.mail.me.com',
        port: 993,
        secure: true,
        authMethod: 'plain',
      }
    }
    
    // Fastmail
    if (domain === 'fastmail.com') {
      return {
        provider: 'fastmail',
        host: 'imap.fastmail.com',
        port: 993,
        secure: true,
        authMethod: 'plain',
      }
    }
    
    // Check for Google Workspace domains
    if (domain.includes('.') && !['gmail.com', 'googlemail.com'].includes(domain)) {
      // This might be a Google Workspace domain, suggest Gmail settings
      return {
        provider: 'google-workspace',
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        authMethod: 'oauth2',
      }
    }
    
    // Generic IMAP fallback
    return {
      provider: 'generic',
      port: 993,
      secure: true,
      authMethod: 'plain',
    }
  }

  /**
   * Create standardized application error
   */
  createAppError(
    message: string,
    code: keyof typeof ERROR_CODES,
    type: AppError['type'],
    details?: any,
    userMessage?: string
  ): AppError {
    const error = new Error(message) as AppError
    error.code = code
    error.type = type
    error.details = details
    error.timestamp = new Date()
    error.userMessage = userMessage || this.getDefaultUserMessage(type, code)
    
    return error
  }

  /**
   * Get user-friendly error message
   */
  private getDefaultUserMessage(type: AppError['type'], code: string): string {
    const messageMap: Record<string, string> = {
      // Authentication errors
      'AUTH_FAILED': 'Authentication failed. Please check your username and password.',
      'AUTH_EXPIRED': 'Your session has expired. Please sign in again.',
      'AUTH_INVALID': 'Invalid credentials provided.',
      
      // Connection errors
      'CONNECTION_FAILED': 'Unable to connect to the server. Please check your internet connection.',
      'CONNECTION_TIMEOUT': 'Connection timed out. Please try again.',
      'CONNECTION_REFUSED': 'Connection refused by the server.',
      
      // IMAP errors
      'IMAP_LOGIN_FAILED': 'Failed to log in to your email account. Please check your credentials.',
      'IMAP_FOLDER_NOT_FOUND': 'The requested email folder was not found.',
      'IMAP_MESSAGE_NOT_FOUND': 'The email message could not be found.',
      'IMAP_OPERATION_FAILED': 'Email operation failed. Please try again.',
      
      // AI errors
      'AI_API_ERROR': 'AI service is currently unavailable. Please try again later.',
      'AI_RATE_LIMITED': 'AI service rate limit exceeded. Please wait before trying again.',
      'AI_QUOTA_EXCEEDED': 'AI service quota exceeded. Please check your subscription.',
      'AI_MODEL_NOT_FOUND': 'The requested AI model is not available.',
      
      // Database errors
      'DB_CONNECTION_FAILED': 'Database connection failed. Please restart the application.',
      'DB_OPERATION_FAILED': 'Database operation failed. Please try again.',
      
      // Validation errors
      'VALIDATION_ERROR': 'Invalid data provided. Please check your input.',
      
      // General errors
      'PERMISSION_DENIED': 'Permission denied. You do not have access to this resource.',
      'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
      'OPERATION_CANCELLED': 'Operation was cancelled.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    }
    
    return messageMap[code] || 'An error occurred. Please try again.'
  }

  /**
   * Validate and sanitize user input
   */
  sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input) return ''
    
    // Remove potential harmful characters
    let sanitized = input
      .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    return sanitized
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: AppError | Error): boolean {
    const retryableCodes = [
      'CONNECTION_TIMEOUT',
      'CONNECTION_FAILED',
      'AI_RATE_LIMITED',
      'DB_CONNECTION_FAILED'
    ]
    
    if ('code' in error) {
      return retryableCodes.includes(error.code)
    }
    
    // Check error message for common retryable patterns
    const retryablePatterns = [
      /timeout/i,
      /connection/i,
      /network/i,
      /temporary/i,
      /rate limit/i
    ]
    
    return retryablePatterns.some(pattern => pattern.test(error.message))
  }
}