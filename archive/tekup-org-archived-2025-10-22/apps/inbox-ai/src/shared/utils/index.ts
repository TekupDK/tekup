/**
 * Utility functions for AI IMAP Inbox
 */

import { EmailAddress, Email } from '../types'
import { EMAIL_PROVIDERS } from '../constants'

/**
 * Email utility functions
 */
export const emailUtils = {
  /**
   * Format email address for display
   */
  formatEmailAddress(address: EmailAddress): string {
    return address.name ? `${address.name} <${address.email}>` : address.email
  },

  /**
   * Parse email address string into EmailAddress object
   */
  parseEmailAddress(addressString: string): EmailAddress {
    const match = addressString.match(/^(.+?)\s*<(.+?)>$/)
    if (match) {
      return {
        name: match[1].trim().replace(/^["']|["']$/g, ''),
        email: match[2].trim(),
      }
    }
    return { email: addressString.trim() }
  },

  /**
   * Get email display name (sender name or email)
   */
  getDisplayName(address: EmailAddress): string {
    return address.name || address.email.split('@')[0]
  },

  /**
   * Get email domain
   */
  getDomain(email: string): string {
    return email.split('@')[1] || ''
  },

  /**
   * Check if email is from internal domain
   */
  isInternalEmail(email: string, internalDomains: string[]): boolean {
    const domain = this.getDomain(email)
    return internalDomains.includes(domain)
  },

  /**
   * Extract initials from name or email
   */
  getInitials(address: EmailAddress): string {
    if (address.name) {
      return address.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }
    const emailPart = address.email.split('@')[0]
    return emailPart.charAt(0).toUpperCase()
  },

  /**
   * Check if email is unread
   */
  isUnread(email: Email): boolean {
    return !email.flags.seen
  },

  /**
   * Check if email is important/flagged
   */
  isImportant(email: Email): boolean {
    return email.flags.flagged || Boolean(email.aiMetadata?.priority && Number(email.aiMetadata.priority) <= 2)
  },

  /**
   * Get email age in human readable format
   */
  getEmailAge(email: Email): string {
    const now = new Date()
    const emailDate = new Date(email.date)
    const diffMs = now.getTime() - emailDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return emailDate.toLocaleDateString()
  },

  /**
   * Generate email preview text
   */
  getPreviewText(email: Email, maxLength: number = 100): string {
    const text = email.body.text || email.body.html?.replace(/<[^>]*>/g, '') || ''
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '')
  },

  /**
   * Check if email has attachments
   */
  hasAttachments(email: Email): boolean {
    return email.attachments.length > 0
  },

  /**
   * Get total attachment size
   */
  getTotalAttachmentSize(email: Email): number {
    return email.attachments.reduce((total, attachment) => total + attachment.size, 0)
  },

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  },
}

/**
 * Date and time utility functions
 */
export const dateUtils = {
  /**
   * Format date for display
   */
  formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
  },

  /**
   * Format time for display
   */
  formatTime(date: Date | string, format: '12h' | '24h' = '24h'): string {
    const d = new Date(date)
    
    if (format === '12h') {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  },

  /**
   * Check if date is today
   */
  isToday(date: Date | string): boolean {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  },

  /**
   * Check if date is yesterday
   */
  isYesterday(date: Date | string): boolean {
    const d = new Date(date)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return d.toDateString() === yesterday.toDateString()
  },

  /**
   * Check if date is this week
   */
  isThisWeek(date: Date | string): boolean {
    const d = new Date(date)
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    return d >= weekStart
  },

  /**
   * Get relative time string
   */
  getRelativeTime(date: Date | string): string {
    const d = new Date(date)
    
    if (this.isToday(d)) {
      return this.formatTime(d)
    }
    
    if (this.isYesterday(d)) {
      return 'Yesterday'
    }
    
    if (this.isThisWeek(d)) {
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    }
    
    return this.formatDate(d)
  },
}

/**
 * String utility functions
 */
export const stringUtils = {
  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, length: number): string {
    return str.length > length ? str.slice(0, length) + '...' : str
  },

  /**
   * Capitalize first letter
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * Convert to title case
   */
  toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, this.capitalize)
  },

  /**
   * Remove HTML tags from string
   */
  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  },

  /**
   * Escape HTML characters
   */
  escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  },

  /**
   * Generate random string
   */
  randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * Generate UUID v4
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
}

/**
 * Array utility functions
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)]
  },

  /**
   * Group array by key
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  /**
   * Sort array by multiple keys
   */
  sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
    return array.sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key]
        const bVal = b[key]
        if (aVal < bVal) return -1
        if (aVal > bVal) return 1
      }
      return 0
    })
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },
}

/**
 * Configuration utility functions
 */
export const configUtils = {
  /**
   * Get provider configuration by name
   */
  getProviderConfig(provider: keyof typeof EMAIL_PROVIDERS) {
    return EMAIL_PROVIDERS[provider]
  },

  /**
   * Detect email provider from domain
   */
  detectProvider(email: string): keyof typeof EMAIL_PROVIDERS {
    const domain = emailUtils.getDomain(email).toLowerCase()
    
    if (domain.includes('gmail.com')) return 'gmail'
    if (domain.includes('googlemail.com')) return 'gmail'
    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return 'outlook'
    if (domain.includes('yahoo.com')) return 'yahoo'
    if (domain.includes('icloud.com') || domain.includes('me.com') || domain.includes('mac.com')) return 'icloud'
    if (domain.includes('fastmail.com')) return 'fastmail'
    if (domain.includes('protonmail.com') || domain.includes('pm.me')) return 'protonmail'
    
    return 'generic'
  },

  /**
   * Validate email configuration
   */
  validateEmailConfig(config: any): boolean {
    return !!(config.host && config.port && config.username && config.password)
  },
}

/**
 * Validation utility functions
 */
export const validationUtils = {
  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  /**
   * Validate port number
   */
  isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535
  },

  /**
   * Check if string is empty or whitespace
   */
  isEmpty(str: string): boolean {
    return !str || str.trim().length === 0
  },
}

/**
 * Error handling utility functions
 */
export const errorUtils = {
  /**
   * Create user-friendly error message
   */
  getUserMessage(error: Error): string {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'ECONNREFUSED': 'Unable to connect to the email server. Please check your internet connection and server settings.',
      'ENOTFOUND': 'Email server not found. Please verify the server address.',
      'ETIMEDOUT': 'Connection timed out. Please try again later.',
      'EAUTH': 'Authentication failed. Please check your username and password.',
      'CERT_INVALID': 'Invalid security certificate. The connection may not be secure.',
    }

    for (const [code, message] of Object.entries(errorMap)) {
      if (error.message.includes(code)) {
        return message
      }
    }

    return 'An unexpected error occurred. Please try again.'
  },

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    const retryableCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND']
    return retryableCodes.some(code => error.message.includes(code))
  },
}

/**
 * Performance utility functions
 */
export const performanceUtils = {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-shared-utils');

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  },

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  /**
   * Measure execution time
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    logger.info(`${name} took ${end - start} milliseconds`)
    return result
  },
}