/**
 * Folder repository for email folder management
 */

import { EmailFolder, FolderRepository } from '@shared/types'
import { BaseRepository } from './BaseRepository.js'
import { AppDatabase } from '../database/Database.js'

export class FolderRepositoryImpl extends BaseRepository<EmailFolder> implements FolderRepository {
  constructor(database: AppDatabase) {
    super(database, 'folders')
  }

  /**
   * Find folders by account ID
   */
  async findByAccount(accountId: string): Promise<EmailFolder[]> {
    try {
      return this.findAll({
        where: { account_id: accountId },
        orderBy: 'name'
      })
    } catch (error) {
      this.log.error('Failed to find folders by account', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Find folder by path
   */
  async findByPath(accountId: string, path: string): Promise<EmailFolder | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE account_id = ? AND path = ?`
      const result = this.executeQuery(sql, [accountId, path])[0]
      
      if (!result) {
        return null
      }

      return this.mapFromDatabase(result)
    } catch (error) {
      this.log.error('Failed to find folder by path', error as Error, { accountId, path })
      throw error
    }
  }

  /**
   * Update folder counts
   */
  async updateCounts(accountId: string, folder: string): Promise<void> {
    try {
      // Get unread count
      const unreadSql = `
        SELECT COUNT(*) as count 
        FROM emails 
        WHERE account_id = ? AND folder = ? AND JSON_EXTRACT(flags, '$.seen') = false
      `
      const unreadResult = this.executeQuery(unreadSql, [accountId, folder])[0] as { count: number }

      // Get total count
      const totalSql = `
        SELECT COUNT(*) as count 
        FROM emails 
        WHERE account_id = ? AND folder = ?
      `
      const totalResult = this.executeQuery(totalSql, [accountId, folder])[0] as { count: number }

      // Update folder counts
      const updateSql = `
        UPDATE ${this.tableName} 
        SET unread_count = ?, total_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = ? AND path = ?
      `
      this.executeStatement(updateSql, [
        unreadResult.count,
        totalResult.count,
        accountId,
        folder
      ])
    } catch (error) {
      this.log.error('Failed to update folder counts', error as Error, { accountId, folder })
      throw error
    }
  }

  /**
   * Sync folders with server folders
   */
  async syncFolders(accountId: string, serverFolders: Partial<EmailFolder>[]): Promise<void> {
    try {
      // Get existing folders first (outside transaction)
      const existingFolders = await this.findAll({ where: { account_id: accountId } })
      const existingPaths = new Set(existingFolders.map(f => f.path))

      const syncTransaction = this.db.transaction(() => {
        // Process server folders
        const serverPaths = new Set()
        
        for (const serverFolder of serverFolders) {
          if (!serverFolder.path) continue
          
          serverPaths.add(serverFolder.path)
          
          const existing = existingFolders.find(f => f.path === serverFolder.path)
          
          if (existing) {
            // Update existing folder
            const updateSql = `
              UPDATE ${this.tableName} 
              SET name = ?, type = ?, attributes = ?, delimiter = ?, updated_at = CURRENT_TIMESTAMP
              WHERE account_id = ? AND path = ?
            `
            this.executeStatement(updateSql, [
              serverFolder.name || existing.name,
              serverFolder.type || existing.type,
              JSON.stringify(serverFolder.attributes || existing.attributes),
              serverFolder.delimiter || existing.delimiter,
              accountId,
              serverFolder.path
            ])
          } else {
            // Create new folder
            const newFolder: EmailFolder = {
              id: this.generateId(),
              accountId,
              name: serverFolder.name || '',
              path: serverFolder.path,
              type: serverFolder.type || 'custom',
              unreadCount: 0,
              totalCount: 0,
              parent: serverFolder.parent,
              children: serverFolder.children || [],
              attributes: serverFolder.attributes || [],
              delimiter: serverFolder.delimiter || '/',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            const dbFolder = this.mapToDatabase(newFolder)
            const columns = Object.keys(dbFolder)
            const placeholders = columns.map(() => '?').join(', ')
            const values = Object.values(dbFolder)

            const insertSql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
            this.executeStatement(insertSql, values)
          }
        }

        // Remove folders that no longer exist on server
        for (const existingFolder of existingFolders) {
          if (!serverPaths.has(existingFolder.path)) {
            this.executeStatement(`DELETE FROM ${this.tableName} WHERE id = ?`, [existingFolder.id])
          }
        }
      })

      syncTransaction()
    } catch (error) {
      this.log.error('Failed to sync folders', error as Error, { accountId, folderCount: serverFolders.length })
      throw error
    }
  }

  /**
   * Get folder hierarchy for account
   */
  async getFolderHierarchy(accountId: string): Promise<EmailFolder[]> {
    try {
      const folders = await this.findByAccount(accountId)
      
      // Build hierarchy
      const folderMap = new Map<string, EmailFolder>()
      folders.forEach(folder => folderMap.set(folder.id, folder))

      // Set up parent-child relationships
      const rootFolders: EmailFolder[] = []
      
      for (const folder of folders) {
        if (folder.parent) {
          const parent = folderMap.get(folder.parent)
          if (parent && !parent.children.includes(folder.id)) {
            parent.children.push(folder.id)
          }
        } else {
          rootFolders.push(folder)
        }
      }

      return rootFolders
    } catch (error) {
      this.log.error('Failed to get folder hierarchy', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Get folders by type
   */
  async findByType(accountId: string, type: string): Promise<EmailFolder[]> {
    try {
      return this.findAll({
        where: { account_id: accountId, type },
        orderBy: 'name'
      })
    } catch (error) {
      this.log.error('Failed to find folders by type', error as Error, { accountId, type })
      throw error
    }
  }

  /**
   * Update folder attributes
   */
  async updateAttributes(folderId: string, attributes: string[]): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET attributes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [JSON.stringify(attributes), folderId])
    } catch (error) {
      this.log.error('Failed to update folder attributes', error as Error, { folderId, attributes })
      throw error
    }
  }

  /**
   * Map database row to EmailFolder entity
   */
  protected mapFromDatabase(row: any): EmailFolder {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      path: row.path,
      type: row.type,
      unreadCount: row.unread_count,
      totalCount: row.total_count,
      parent: row.parent,
      children: JSON.parse(row.children),
      attributes: JSON.parse(row.attributes),
      delimiter: row.delimiter,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  /**
   * Map EmailFolder entity to database row
   */
  protected mapToDatabase(folder: EmailFolder): any {
    return {
      id: folder.id,
      account_id: folder.accountId,
      name: folder.name,
      path: folder.path,
      type: folder.type,
      unread_count: folder.unreadCount,
      total_count: folder.totalCount,
      parent: folder.parent,
      children: JSON.stringify(folder.children),
      attributes: JSON.stringify(folder.attributes),
      delimiter: folder.delimiter,
      created_at: folder.createdAt.toISOString(),
      updated_at: folder.updatedAt.toISOString(),
    }
  }
}