/**
 * Account repository for email account management
 */

import crypto from 'crypto'
import { EmailAccount, AccountRepository } from '@shared/types'
import { BaseRepository } from './BaseRepository.js'
import { AppDatabase } from '../database/Database.js'

export class AccountRepositoryImpl extends BaseRepository<EmailAccount> implements AccountRepository {
  constructor(database: AppDatabase) {
    super(database, 'accounts')
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<EmailAccount[]> {
    try {
      return await this.findAll({ orderBy: 'display_name' })
    } catch (error) {
      this.log.error('Failed to get all accounts', error as Error)
      throw error
    }
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<EmailAccount | null> {
    try {
      return await this.findById(accountId)
    } catch (error) {
      this.log.error('Failed to get account by ID', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Create new account
   */
  async createAccount(accountData: Partial<EmailAccount>): Promise<EmailAccount> {
    try {
      const account: EmailAccount = {
        id: accountData.id || crypto.randomUUID(),
        provider: accountData.provider!,
        displayName: accountData.displayName!,
        emailAddress: accountData.emailAddress!,
        imap: accountData.imap!,
        smtp: accountData.smtp,
        folders: accountData.folders || [],
        quotaUsed: accountData.quotaUsed || 0,
        quotaLimit: accountData.quotaLimit,
        status: accountData.status || 'active',
        lastError: accountData.lastError,
        features: accountData.features || {
          supportsIdle: false,
          supportsMove: true,
          supportsQuota: false,
          supportsSearch: true,
          supportsSort: false,
          supportsCondstore: false,
          maxMessageSize: 25 * 1024 * 1024 // 25MB
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      return await this.create(account)
    } catch (error) {
      this.log.error('Failed to create account', error as Error, { accountData })
      throw error
    }
  }

  /**
   * Update account
   */
  async updateAccount(accountId: string, updates: Partial<EmailAccount>): Promise<EmailAccount> {
    try {
      return await this.update(accountId, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      this.log.error('Failed to update account', error as Error, { accountId, updates })
      throw error
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(accountId: string): Promise<boolean> {
    try {
      await this.delete(accountId)
      return true
    } catch (error) {
      this.log.error('Failed to delete account', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Find account by email address
   */
  async findByEmail(email: string): Promise<EmailAccount | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE email_address = ?`
      const result = this.executeQuery(sql, [email])[0]
      
      if (!result) {
        return null
      }

      return this.mapFromDatabase(result)
    } catch (error) {
      this.log.error('Failed to find account by email', error as Error, { email })
      throw error
    }
  }

  /**
   * Find all active accounts
   */
  async findActive(): Promise<EmailAccount[]> {
    try {
      return this.findAll({
        where: { status: 'active' },
        orderBy: 'display_name'
      })
    } catch (error) {
      this.log.error('Failed to find active accounts', error as Error)
      throw error
    }
  }

  /**
   * Update account status
   */
  async updateStatus(accountId: string, status: string, error?: string): Promise<void> {
    try {
      const updateData: any = { status }
      if (error) {
        updateData.last_error = error
      } else {
        updateData.last_error = null
      }

      const sql = `
        UPDATE ${this.tableName} 
        SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [status, updateData.last_error, accountId])
    } catch (err) {
      this.log.error('Failed to update account status', err as Error, { accountId, status, error })
      throw err
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(accountId: string, timestamp: Date): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET last_sync_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [timestamp.toISOString(), accountId])
    } catch (error) {
      this.log.error('Failed to update last sync', error as Error, { accountId, timestamp })
      throw error
    }
  }

  /**
   * Get accounts that need syncing
   */
  async findAccountsNeedingSync(): Promise<EmailAccount[]> {
    try {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE status = 'active' 
        AND (
          last_sync_at IS NULL 
          OR last_sync_at < datetime('now', '-' || JSON_EXTRACT(imap_config, '$.syncInterval') || ' minutes')
        )
        ORDER BY last_sync_at ASC NULLS FIRST
      `
      const results = this.executeQuery(sql)
      return results.map(row => this.mapFromDatabase(row))
    } catch (error) {
      this.log.error('Failed to find accounts needing sync', error as Error)
      throw error
    }
  }

  /**
   * Update account quota
   */
  async updateQuota(accountId: string, used: number, limit: number): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET quota_used = ?, quota_limit = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [used, limit, accountId])
    } catch (error) {
      this.log.error('Failed to update account quota', error as Error, { accountId, used, limit })
      throw error
    }
  }

  /**
   * Update account folders list
   */
  async updateFolders(accountId: string, folders: string[]): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET folders = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [JSON.stringify(folders), accountId])
    } catch (error) {
      this.log.error('Failed to update account folders', error as Error, { accountId, folders })
      throw error
    }
  }

  /**
   * Get account statistics
   */
  async getAccountStats(accountId: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_emails,
          SUM(CASE WHEN JSON_EXTRACT(flags, '$.seen') = false THEN 1 ELSE 0 END) as unread_emails,
          SUM(CASE WHEN JSON_EXTRACT(flags, '$.flagged') = true THEN 1 ELSE 0 END) as flagged_emails,
          SUM(size) as total_size,
          MIN(date) as oldest_email,
          MAX(date) as newest_email
        FROM emails 
        WHERE account_id = ?
      `
      const result = this.executeQuery(sql, [accountId])[0]
      
      return {
        totalEmails: result.total_emails,
        unreadEmails: result.unread_emails,
        flaggedEmails: result.flagged_emails,
        totalSize: result.total_size,
        oldestEmail: result.oldest_email ? new Date(result.oldest_email) : null,
        newestEmail: result.newest_email ? new Date(result.newest_email) : null,
      }
    } catch (error) {
      this.log.error('Failed to get account stats', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Map database row to EmailAccount entity
   */
  protected mapFromDatabase(row: any): EmailAccount {
    const imapConfig = JSON.parse(row.imap_config)
    const smtpConfig = row.smtp_config ? JSON.parse(row.smtp_config) : undefined
    const features = JSON.parse(row.features)
    const folders = JSON.parse(row.folders)

    return {
      id: row.id,
      provider: row.provider,
      displayName: row.display_name,
      emailAddress: row.email_address,
      imap: {
        ...imapConfig,
        createdAt: new Date(imapConfig.createdAt),
        updatedAt: new Date(imapConfig.updatedAt),
        lastSyncAt: imapConfig.lastSyncAt ? new Date(imapConfig.lastSyncAt) : undefined,
      },
      smtp: smtpConfig,
      folders,
      quotaUsed: row.quota_used,
      quotaLimit: row.quota_limit,
      status: row.status,
      lastError: row.last_error,
      features,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  /**
   * Map EmailAccount entity to database row
   */
  protected mapToDatabase(account: EmailAccount): any {
    return {
      id: account.id,
      provider: account.provider,
      display_name: account.displayName,
      email_address: account.emailAddress,
      imap_config: JSON.stringify({
        ...account.imap,
        createdAt: account.imap.createdAt.toISOString(),
        updatedAt: account.imap.updatedAt.toISOString(),
        lastSyncAt: account.imap.lastSyncAt?.toISOString(),
      }),
      smtp_config: account.smtp ? JSON.stringify(account.smtp) : null,
      folders: JSON.stringify(account.folders),
      quota_used: account.quotaUsed,
      quota_limit: account.quotaLimit,
      status: account.status,
      last_error: account.lastError,
      features: JSON.stringify(account.features),
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
      last_sync_at: account.imap.lastSyncAt?.toISOString(),
    }
  }
}