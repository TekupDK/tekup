/**
 * TekUp Secure Platform - Email Service Module
 * Integrates with TekUp Flow lead ingestion system
 */

import { EventEmitter } from 'events'
import { LogService } from './LogService'
import { ConfigurationServiceImpl } from './ConfigurationService'
import { AppDatabase } from '../database/Database'
import { EmailAccount, Email, EmailFolder, LeadSource } from '@shared/types'
import * as fs from 'fs'
import * as path from 'path'

export interface IMAPConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  provider: 'gmail' | 'outlook' | 'generic'
}

export interface LeadParsingResult {
  leadId: string
  brand: 'rendetalje' | 'foodtruck-fiesta' | 'tekup'
  source: LeadSource
  extractedFields: Record<string, any>
  classification: 'lead' | 'drift' | 'service' | 'irrelevant'
  confidence: number
}

export class EmailService extends EventEmitter {
  private log: LogService
  private config: ConfigurationServiceImpl
  private database: AppDatabase
  // Project X path removed - using TekUp Flow integration instead
  private isInitialized = false
  private syncIntervals = new Map<string, NodeJS.Timeout>()

  constructor(database: AppDatabase, config: ConfigurationServiceImpl) {
    super()
    this.database = database
    this.config = config
    this.log = new LogService()
    // Project X path initialization removed
  }

  /**
   * Initialize email service with TekUp Flow integration
   */
  async initialize(): Promise<void> {
    try {
      this.log.info('Initializing TekUp Email Service with Flow integration')
      
      // Project X connection verification removed - using Flow integration
      
      // Load email accounts from config
      const accounts = await this.config.getEmailAccounts()
      this.log.info(`Loaded ${accounts.length} email accounts`)
      
      // Initialize IMAP connections for each account
      for (const account of accounts) {
        await this.initializeAccountSync(account)
      }
      
      this.isInitialized = true
      this.log.info('TekUp Email Service initialized successfully')
      this.emit('initialized')
      
    } catch (error) {
      this.log.error('Failed to initialize Email Service', error as Error)
      throw error
    }
  }

  // verifyProjectXConnection method removed - using Flow integration instead

  /**
   * Add new email account
   */
  async addAccount(account: EmailAccount): Promise<EmailAccount> {
    try {
      this.log.info('Adding email account', { email: account.email, provider: account.provider })
      
      // Test connection first
      await this.testConnection(account)
      
      // Save to configuration
      const savedAccount = await this.config.saveEmailAccount(account)
      
      // Initialize sync for this account
      await this.initializeAccountSync(savedAccount)
      
      this.emit('accountAdded', savedAccount)
      return savedAccount
      
    } catch (error) {
      this.log.error('Failed to add email account', error as Error)
      throw error
    }
  }

  /**
   * Remove email account
   */
  async removeAccount(accountId: string): Promise<boolean> {
    try {
      this.log.info('Removing email account', { accountId })
      
      // Stop sync for this account
      if (this.syncIntervals.has(accountId)) {
        clearInterval(this.syncIntervals.get(accountId)!)
        this.syncIntervals.delete(accountId)
      }
      
      // Remove from configuration
      const result = await this.config.deleteEmailAccount(accountId)
      
      this.emit('accountRemoved', accountId)
      return result
      
    } catch (error) {
      this.log.error('Failed to remove email account', error as Error)
      throw error
    }
  }

  /**
   * Sync emails from IMAP server
   */
  async syncEmails(accountId: string): Promise<{ synced: number, leads: number }> {
    try {
      this.log.debug('Starting email sync', { accountId })
      
      const account = await this.config.getEmailAccount(accountId)
      if (!account) {
        throw new Error(`Account ${accountId} not found`)
      }
      
      // Connect to IMAP and fetch new emails
      const emails = await this.fetchNewEmails(account)
      this.log.debug(`Fetched ${emails.length} new emails`, { accountId })
      
      let leadsProcessed = 0
      
      // Process each email for lead extraction
      for (const email of emails) {
        try {
          const leadResult = await this.processEmailForLeads(email, account)
          if (leadResult && leadResult.classification === 'lead') {
            leadsProcessed++
            // Lead forwarding now handled by Flow ingestion service
            this.log.info('Lead detected - forwarding via Flow service', { leadId: leadResult.leadId })
          }
        } catch (error) {
          this.log.warn('Failed to process email for leads', error as Error, { emailId: email.id })
        }
      }
      
      // Store emails in database
      await this.storeEmails(emails, accountId)
      
      const result = { synced: emails.length, leads: leadsProcessed }
      this.emit('emailsSynced', { accountId, ...result })
      
      return result
      
    } catch (error) {
      this.log.error('Email sync failed', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Get emails for account
   */
  async getEmails(accountId: string, folderId?: string, limit = 50, offset = 0): Promise<Email[]> {
    try {
      // Query emails from database
      const query = `
        SELECT * FROM emails 
        WHERE account_id = ? 
        ${folderId ? 'AND folder_id = ?' : ''}
        ORDER BY received_at DESC 
        LIMIT ? OFFSET ?
      `
      
      const params = folderId 
        ? [accountId, folderId, limit, offset]
        : [accountId, limit, offset]
      
      const stmt = this.database.prepare(query)
      const emails = stmt.all(...params) as Email[]
      
      return emails
      
    } catch (error) {
      this.log.error('Failed to get emails', error as Error)
      throw error
    }
  }

  /**
   * Get single email by ID
   */
  async getEmail(emailId: string): Promise<Email | null> {
    try {
      const stmt = this.database.prepare('SELECT * FROM emails WHERE id = ?')
      const email = stmt.get(emailId) as Email | undefined
      
      return email || null
      
    } catch (error) {
      this.log.error('Failed to get email', error as Error)
      throw error
    }
  }

  /**
   * Get folders for account
   */
  async getFolders(accountId: string): Promise<EmailFolder[]> {
    try {
      const stmt = this.database.prepare('SELECT * FROM email_folders WHERE account_id = ?')
      const folders = stmt.all(accountId) as EmailFolder[]
      
      return folders
      
    } catch (error) {
      this.log.error('Failed to get folders', error as Error)
      throw error
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: { text?: string, from?: string, subject?: string, accountId?: string }): Promise<Email[]> {
    try {
      let sql = 'SELECT * FROM emails WHERE 1=1'
      const params: any[] = []
      
      if (query.text) {
        sql += ' AND (subject LIKE ? OR body LIKE ?)'
        params.push(`%${query.text}%`, `%${query.text}%`)
      }
      
      if (query.from) {
        sql += ' AND from_address LIKE ?'
        params.push(`%${query.from}%`)
      }
      
      if (query.subject) {
        sql += ' AND subject LIKE ?'
        params.push(`%${query.subject}%`)
      }
      
      if (query.accountId) {
        sql += ' AND account_id = ?'
        params.push(query.accountId)
      }
      
      sql += ' ORDER BY received_at DESC LIMIT 100'
      
      const stmt = this.database.prepare(sql)
      const emails = stmt.all(...params) as Email[]
      
      return emails
      
    } catch (error) {
      this.log.error('Email search failed', error as Error)
      throw error
    }
  }

  /**
   * Perform email action (mark read, delete, etc.)
   */
  async performAction(action: { type: string, emailIds: string[], data?: any }): Promise<boolean> {
    try {
      this.log.debug('Performing email action', { type: action.type, count: action.emailIds.length })
      
      switch (action.type) {
        case 'markRead':
          await this.markEmailsAsRead(action.emailIds, true)
          break
        case 'markUnread':
          await this.markEmailsAsRead(action.emailIds, false)
          break
        case 'delete':
          await this.deleteEmails(action.emailIds)
          break
        case 'move':
          await this.moveEmails(action.emailIds, action.data.folderId)
          break
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }
      
      return true
      
    } catch (error) {
      this.log.error('Email action failed', error as Error)
      throw error
    }
  }

  /**
   * Test email connection
   */
  private async testConnection(account: EmailAccount): Promise<boolean> {
    try {
      this.log.debug('Testing email connection', { email: account.email })
      
      // TODO: Implement actual IMAP connection test
      // For now, just validate configuration
      if (!account.imapHost || !account.imapPort || !account.email || !account.password) {
        throw new Error('Invalid IMAP configuration')
      }
      
      return true
      
    } catch (error) {
      this.log.error('Connection test failed', error as Error)
      throw error
    }
  }

  /**
   * Initialize sync for account
   */
  private async initializeAccountSync(account: EmailAccount): Promise<void> {
    try {
      // Stop existing sync if any
      if (this.syncIntervals.has(account.id)) {
        clearInterval(this.syncIntervals.get(account.id)!)
      }
      
      // Start periodic sync (every 5 minutes)
      const interval = setInterval(async () => {
        try {
          await this.syncEmails(account.id)
        } catch (error) {
          this.log.error('Periodic sync failed', error as Error, { accountId: account.id })
        }
      }, 5 * 60 * 1000)
      
      this.syncIntervals.set(account.id, interval)
      this.log.debug('Initialized sync for account', { accountId: account.id })
      
    } catch (error) {
      this.log.error('Failed to initialize account sync', error as Error)
      throw error
    }
  }

  /**
   * Fetch new emails from IMAP server
   */
  private async fetchNewEmails(account: EmailAccount): Promise<Email[]> {
    // TODO: Implement actual IMAP client
    // For now, return empty array
    this.log.debug('Fetching emails from IMAP', { accountId: account.id })
    return []
  }

  /**
   * Process email for lead extraction using TekUp Flow patterns
   */
  private async processEmailForLeads(email: Email, account: EmailAccount): Promise<LeadParsingResult | null> {
    try {
      // Classify email first
      const classification = this.classifyEmail(email)
      
      if (classification !== 'lead') {
        return null
      }
      
      // Extract lead data based on TekUp Flow patterns
      const extractedFields = this.extractLeadFields(email)
      const brand = this.determineBrand(email, account)
      const source = this.identifyLeadSource(email)
      
      return {
        leadId: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brand,
        source,
        extractedFields,
        classification,
        confidence: this.calculateConfidence(extractedFields)
      }
      
    } catch (error) {
      this.log.error('Lead processing failed', error as Error)
      return null
    }
  }

  /**
   * Classify email based on TekUp Flow criteria
   */
  private classifyEmail(email: Email): 'lead' | 'drift' | 'service' | 'irrelevant' {
    const subject = email.subject.toLowerCase()
    const from = email.fromAddress.toLowerCase()
    
    // Lead indicators
    const leadKeywords = ['nyt lead', 'ny forespørgsel', 'tilbud', 'booking', 'kontaktformular']
    const leadSources = ['leadpoint.dk', 'leadmail.no', '3match.dk', 'adhelp.dk']
    
    if (leadSources.some(source => from.includes(source)) || 
        leadKeywords.some(keyword => subject.includes(keyword))) {
      return 'lead'
    }
    
    // Drift indicators
    if (subject.startsWith('re:') || subject.includes('bekræftelse') || subject.includes('aftale')) {
      return 'drift'
    }
    
    return 'irrelevant'
  }

  /**
   * Extract lead fields based on TekUp Flow patterns
   */
  private extractLeadFields(email: Email): Record<string, any> {
    const fields: Record<string, any> = {}
    const body = email.body
    
    // Common patterns for lead extraction
    const patterns = {
      navn: /navn:\s*(.+)/i,
      telefon: /(?:telefon|tlf):\s*(.+)/i,
      email: /e-?mail:\s*(.+)/i,
      adresse: /adresse:\s*(.+)/i,
      areal: /areal:\s*(\d+)\s*m²/i,
      antal: /antal.*?(\d+)/i,
      dato: /dato:\s*(.+)/i
    }
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = body.match(pattern)
      if (match) {
        fields[field] = match[1].trim()
      }
    }
    
    return fields
  }

  /**
   * Determine brand from email context
   */
  private determineBrand(email: Email, account: EmailAccount): 'rendetalje' | 'foodtruck-fiesta' | 'tekup' {
    const to = email.toAddress.toLowerCase()
    const subject = email.subject.toLowerCase()
    
    if (to.includes('rendetalje') || subject.includes('rengøring')) {
      return 'rendetalje'
    }
    
    if (to.includes('foodtruck') || subject.includes('catering') || subject.includes('event')) {
      return 'foodtruck-fiesta'
    }
    
    return 'tekup'
  }

  /**
   * Identify lead source
   */
  private identifyLeadSource(email: Email): LeadSource {
    const from = email.fromAddress.toLowerCase()
    
    if (from.includes('leadpoint.dk')) return 'leadpoint'
    if (from.includes('leadmail.no')) return 'leadmail'
    if (from.includes('3match.dk')) return '3match'
    if (from.includes('adhelp.dk')) return 'adhelp'
    
    return 'website'
  }

  /**
   * Calculate confidence score for lead extraction
   */
  private calculateConfidence(fields: Record<string, any>): number {
    const requiredFields = ['navn', 'telefon', 'email']
    const foundRequired = requiredFields.filter(field => fields[field]).length
    
    return (foundRequired / requiredFields.length) * 100
  }

  // forwardToProjectX method removed - use Flow ingestion service instead

  /**
   * Store emails in database
   */
  private async storeEmails(emails: Email[], accountId: string): Promise<void> {
    try {
      const stmt = this.database.prepare(`
        INSERT OR REPLACE INTO emails 
        (id, account_id, folder_id, subject, from_address, to_address, body, received_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const email of emails) {
        stmt.run(
          email.id,
          accountId,
          email.folderId || 'INBOX',
          email.subject,
          email.fromAddress,
          email.toAddress,
          email.body,
          email.receivedAt,
          email.isRead ? 1 : 0
        )
      }
      
    } catch (error) {
      this.log.error('Failed to store emails', error as Error)
      throw error
    }
  }

  /**
   * Mark emails as read/unread
   */
  private async markEmailsAsRead(emailIds: string[], isRead: boolean): Promise<void> {
    const stmt = this.database.prepare('UPDATE emails SET is_read = ? WHERE id = ?')
    
    for (const emailId of emailIds) {
      stmt.run(isRead ? 1 : 0, emailId)
    }
  }

  /**
   * Delete emails
   */
  private async deleteEmails(emailIds: string[]): Promise<void> {
    const stmt = this.database.prepare('DELETE FROM emails WHERE id = ?')
    
    for (const emailId of emailIds) {
      stmt.run(emailId)
    }
  }

  /**
   * Move emails to folder
   */
  private async moveEmails(emailIds: string[], folderId: string): Promise<void> {
    const stmt = this.database.prepare('UPDATE emails SET folder_id = ? WHERE id = ?')
    
    for (const emailId of emailIds) {
      stmt.run(folderId, emailId)
    }
  }

  /**
   * Shutdown email service
   */
  async shutdown(): Promise<void> {
    try {
      this.log.info('Shutting down Email Service')
      
      // Clear all sync intervals
      for (const [accountId, interval] of this.syncIntervals) {
        clearInterval(interval)
      }
      this.syncIntervals.clear()
      
      this.emit('shutdown')
      
    } catch (error) {
      this.log.error('Email Service shutdown failed', error as Error)
      throw error
    }
  }
}
