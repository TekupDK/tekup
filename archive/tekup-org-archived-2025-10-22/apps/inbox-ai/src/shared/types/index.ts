/**
 * Main types export file for AI IMAP Inbox
 */

// Email types
export * from './email'

// Configuration types
export * from './config'

// AI service types  
export * from './ai'

// Database and service types
export * from './database'

// Error types
export class AppError extends Error {
  code: string
  type: string
  accountId?: string
  timestamp: Date
  details?: any
  userMessage?: string

  constructor(message: string, code: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.type = 'application'
    this.timestamp = new Date()
    this.details = details
  }
}