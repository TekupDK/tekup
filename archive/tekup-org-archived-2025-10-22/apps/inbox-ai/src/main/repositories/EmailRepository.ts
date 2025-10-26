/**
 * Email repository for email CRUD operations
 */

import { Email, EmailRepository, FindOptions, SearchQuery, SearchResult } from '@shared/types'
import { BaseRepository } from './BaseRepository.js'
import { AppDatabase } from '../database/Database.js'

export class EmailRepositoryImpl extends BaseRepository<Email> implements EmailRepository {
  constructor(database: AppDatabase) {
    super(database, 'emails')
  }

  /**
   * Find emails by account ID
   */
  async findByAccount(accountId: string, options: FindOptions = {}): Promise<Email[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, account_id: accountId }
    })
  }

  /**
   * Find emails by folder
   */
  async findByFolder(accountId: string, folder: string, options: FindOptions = {}): Promise<Email[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, account_id: accountId, folder }
    })
  }

  /**
   * Find emails by thread ID
   */
  async findByThread(threadId: string): Promise<Email[]> {
    return this.findAll({
      where: { thread_id: threadId },
      orderBy: 'date',
      orderDirection: 'ASC'
    })
  }

  /**
   * Search emails with advanced query
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now()
    
    try {
      let sql = `
        SELECT DISTINCT e.* 
        FROM emails e
        LEFT JOIN emails_fts fts ON e.rowid = fts.rowid
        WHERE 1=1
      `
      const params: any[] = []
      const conditions: string[] = []

      // Full-text search
      if (query.text) {
        conditions.push(`fts MATCH ?`)
        params.push(query.text)
      }

      // Sender filter
      if (query.from) {
        conditions.push(`JSON_EXTRACT(e.sender, '$.email') LIKE ?`)
        params.push(`%${query.from}%`)
      }

      // Recipient filter
      if (query.to) {
        conditions.push(`e.recipients LIKE ?`)
        params.push(`%${query.to}%`)
      }

      // Subject filter
      if (query.subject) {
        conditions.push(`e.subject LIKE ?`)
        params.push(`%${query.subject}%`)
      }

      // Folder filter
      if (query.folder) {
        conditions.push(`e.folder = ?`)
        params.push(query.folder)
      }

      // Attachments filter
      if (query.hasAttachments !== undefined) {
        if (query.hasAttachments) {
          conditions.push(`EXISTS (SELECT 1 FROM attachments WHERE email_id = e.id)`)
        } else {
          conditions.push(`NOT EXISTS (SELECT 1 FROM attachments WHERE email_id = e.id)`)
        }
      }

      // Category filter
      if (query.category) {
        conditions.push(`JSON_EXTRACT(e.ai_metadata, '$.category') = ?`)
        params.push(query.category)
      }

      // Priority filter
      if (query.priority) {
        conditions.push(`JSON_EXTRACT(e.ai_metadata, '$.priority') = ?`)
        params.push(query.priority)
      }

      // Date range filter
      if (query.dateRange) {
        conditions.push(`e.date BETWEEN ? AND ?`)
        params.push(query.dateRange.start.toISOString(), query.dateRange.end.toISOString())
      }

      // Flags filter
      if (query.flags) {
        Object.entries(query.flags).forEach(([flag, value]) => {
          if (value !== undefined) {
            conditions.push(`JSON_EXTRACT(e.flags, '$.${flag}') = ?`)
            params.push(value)
          }
        })
      }

      // Add conditions to SQL
      if (conditions.length > 0) {
        sql += ` AND ${conditions.join(' AND ')}`
      }

      // Add ordering
      const sortBy = query.sortBy || 'date'
      const sortOrder = query.sortOrder || 'desc'
      sql += ` ORDER BY e.${sortBy} ${sortOrder.toUpperCase()}`

      // Get total count for pagination
      const countSql = sql.replace('SELECT DISTINCT e.*', 'SELECT COUNT(DISTINCT e.id) as total')
      const countResult = this.executeQuery(countSql, params)[0] as { total: number }
      const totalCount = countResult.total

      // Add pagination
      const limit = query.limit || 50
      const offset = query.offset || 0
      sql += ` LIMIT ${limit} OFFSET ${offset}`

      // Execute search query
      const results = this.executeQuery(sql, params)
      const emails = results.map(row => this.mapFromDatabase(row))

      const executionTime = Date.now() - startTime

      return {
        emails,
        totalCount,
        hasMore: offset + emails.length < totalCount,
        query,
        executionTime
      }
    } catch (error) {
      this.log.error('Failed to search emails', error as Error, { query })
      throw error
    }
  }

  /**
   * Mark emails as read
   */
  async markAsRead(emailIds: string[]): Promise<void> {
    if (emailIds.length === 0) return

    try {
      const placeholders = emailIds.map(() => '?').join(',')
      const sql = `
        UPDATE emails 
        SET flags = JSON_SET(flags, '$.seen', true), updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `
      this.executeStatement(sql, emailIds)
    } catch (error) {
      this.log.error('Failed to mark emails as read', error as Error, { emailIds })
      throw error
    }
  }

  /**
   * Mark emails as unread
   */
  async markAsUnread(emailIds: string[]): Promise<void> {
    if (emailIds.length === 0) return

    try {
      const placeholders = emailIds.map(() => '?').join(',')
      const sql = `
        UPDATE emails 
        SET flags = JSON_SET(flags, '$.seen', false), updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `
      this.executeStatement(sql, emailIds)
    } catch (error) {
      this.log.error('Failed to mark emails as unread', error as Error, { emailIds })
      throw error
    }
  }

  /**
   * Move emails to folder
   */
  async moveToFolder(emailIds: string[], folder: string): Promise<void> {
    if (emailIds.length === 0) return

    try {
      const placeholders = emailIds.map(() => '?').join(',')
      const sql = `
        UPDATE emails 
        SET folder = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `
      this.executeStatement(sql, [folder, ...emailIds])
    } catch (error) {
      this.log.error('Failed to move emails to folder', error as Error, { emailIds, folder })
      throw error
    }
  }

  /**
   * Delete emails
   */
  async deleteEmails(emailIds: string[]): Promise<void> {
    if (emailIds.length === 0) return

    try {
      const placeholders = emailIds.map(() => '?').join(',')
      const sql = `DELETE FROM emails WHERE id IN (${placeholders})`
      this.executeStatement(sql, emailIds)
    } catch (error) {
      this.log.error('Failed to delete emails', error as Error, { emailIds })
      throw error
    }
  }

  /**
   * Bulk insert emails
   */
  async bulkInsert(emails: Email[]): Promise<void> {
    if (emails.length === 0) return

    try {
      const insertStatement = this.db.prepare(`
        INSERT OR REPLACE INTO emails (
          id, account_id, message_id, thread_id, subject, sender, recipients,
          cc, bcc, reply_to, date, received_date, body_text, body_html,
          folder, size, headers, flags, ai_metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const insertMany = this.db.transaction((emails: Email[]) => {
        for (const email of emails) {
          const dbEmail = this.mapToDatabase(email)
          insertStatement.run(
            dbEmail.id, dbEmail.account_id, dbEmail.message_id, dbEmail.thread_id,
            dbEmail.subject, dbEmail.sender, dbEmail.recipients, dbEmail.cc,
            dbEmail.bcc, dbEmail.reply_to, dbEmail.date, dbEmail.received_date,
            dbEmail.body_text, dbEmail.body_html, dbEmail.folder, dbEmail.size,
            dbEmail.headers, dbEmail.flags, dbEmail.ai_metadata,
            dbEmail.created_at, dbEmail.updated_at
          )
        }
      })

      insertMany(emails)
    } catch (error) {
      this.log.error('Failed to bulk insert emails', error as Error, { count: emails.length })
      throw error
    }
  }

  /**
   * Get unread count for account/folder
   */
  async getUnreadCount(accountId: string, folder?: string): Promise<number> {
    try {
      let sql = `
        SELECT COUNT(*) as count 
        FROM emails 
        WHERE account_id = ? AND JSON_EXTRACT(flags, '$.seen') = false
      `
      const params = [accountId]

      if (folder) {
        sql += ` AND folder = ?`
        params.push(folder)
      }

      const result = this.executeQuery(sql, params)[0] as { count: number }
      return result.count
    } catch (error) {
      this.log.error('Failed to get unread count', error as Error, { accountId, folder })
      throw error
    }
  }

  /**
   * Find duplicate emails
   */
  async findDuplicates(accountId: string): Promise<string[]> {
    try {
      const sql = `
        SELECT id
        FROM emails
        WHERE account_id = ? 
        AND message_id IN (
          SELECT message_id
          FROM emails
          WHERE account_id = ?
          GROUP BY message_id
          HAVING COUNT(*) > 1
        )
        ORDER BY date DESC
      `
      const results = this.executeQuery(sql, [accountId, accountId])
      return results.map((row: any) => row.id)
    } catch (error) {
      this.log.error('Failed to find duplicate emails', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Cleanup old emails
   */
  async cleanup(olderThan: Date): Promise<number> {
    try {
      const sql = `DELETE FROM emails WHERE created_at < ?`
      const result = this.executeStatement(sql, [olderThan.toISOString()])
      return result.changes
    } catch (error) {
      this.log.error('Failed to cleanup old emails', error as Error, { olderThan })
      throw error
    }
  }

  /**
   * Map database row to Email entity
   */
  protected mapFromDatabase(row: any): Email {
    return {
      id: row.id,
      accountId: row.account_id,
      messageId: row.message_id,
      threadId: row.thread_id,
      subject: row.subject,
      from: JSON.parse(row.sender),
      to: JSON.parse(row.recipients),
      cc: row.cc ? JSON.parse(row.cc) : undefined,
      bcc: row.bcc ? JSON.parse(row.bcc) : undefined,
      replyTo: row.reply_to ? JSON.parse(row.reply_to) : undefined,
      date: new Date(row.date),
      receivedDate: new Date(row.received_date),
      body: {
        text: row.body_text,
        html: row.body_html,
      },
      attachments: [], // Will be loaded separately
      flags: JSON.parse(row.flags),
      folder: row.folder,
      size: row.size,
      headers: row.headers ? JSON.parse(row.headers) : {},
      aiMetadata: row.ai_metadata ? JSON.parse(row.ai_metadata) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  /**
   * Map Email entity to database row
   */
  protected mapToDatabase(email: Email): any {
    return {
      id: email.id,
      account_id: email.accountId,
      message_id: email.messageId,
      thread_id: email.threadId,
      subject: email.subject,
      sender: JSON.stringify(email.from),
      recipients: JSON.stringify(email.to),
      cc: email.cc ? JSON.stringify(email.cc) : null,
      bcc: email.bcc ? JSON.stringify(email.bcc) : null,
      reply_to: email.replyTo ? JSON.stringify(email.replyTo) : null,
      date: email.date.toISOString(),
      received_date: email.receivedDate.toISOString(),
      body_text: email.body.text,
      body_html: email.body.html,
      folder: email.folder,
      size: email.size,
      headers: JSON.stringify(email.headers),
      flags: JSON.stringify(email.flags),
      ai_metadata: email.aiMetadata ? JSON.stringify(email.aiMetadata) : null,
      created_at: email.createdAt.toISOString(),
      updated_at: email.updatedAt.toISOString(),
    }
  }
}