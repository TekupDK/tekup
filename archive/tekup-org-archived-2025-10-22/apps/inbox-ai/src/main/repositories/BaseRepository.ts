/**
 * Base repository class with common CRUD operations
 */

import { Database } from 'better-sqlite3'
import { Repository, FindOptions } from '@shared/types'
import { AppDatabase } from '../database/Database.js'
import { LogService } from '../services/LogService.js'

export abstract class BaseRepository<T, K = string> implements Repository<T, K> {
  protected db: Database
  protected log: LogService
  protected tableName: string

  constructor(database: AppDatabase, tableName: string) {
    this.db = database.getInstance()
    this.log = new LogService()
    this.tableName = tableName
  }

  /**
   * Find entity by ID
   */
  async findById(id: K): Promise<T | null> {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
      const result = stmt.get(id) as any
      
      if (!result) {
        return null
      }

      return this.mapFromDatabase(result)
    } catch (error) {
      this.log.error(`Failed to find ${this.tableName} by ID`, error as Error, { id })
      throw error
    }
  }

  /**
   * Find all entities with optional filtering and pagination
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName}`
      const params: any[] = []

      // Add WHERE clause
      if (options.where) {
        const conditions = Object.keys(options.where).map(key => `${key} = ?`)
        sql += ` WHERE ${conditions.join(' AND ')}`
        params.push(...Object.values(options.where))
      }

      // Add ORDER BY clause
      if (options.orderBy) {
        const direction = options.orderDirection || 'ASC'
        sql += ` ORDER BY ${options.orderBy} ${direction}`
      }

      // Add LIMIT and OFFSET
      if (options.limit) {
        sql += ` LIMIT ${options.limit}`
        if (options.offset) {
          sql += ` OFFSET ${options.offset}`
        }
      }

      const stmt = this.db.prepare(sql)
      const results = stmt.all(...params) as any[]
      
      return results.map(result => this.mapFromDatabase(result))
    } catch (error) {
      this.log.error(`Failed to find all ${this.tableName}`, error as Error, { options })
      throw error
    }
  }

  /**
   * Create a new entity
   */
  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const entityWithId = {
        ...entity,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T

      const dbEntity = this.mapToDatabase(entityWithId)
      const columns = Object.keys(dbEntity)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(dbEntity)

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
      const stmt = this.db.prepare(sql)
      stmt.run(...values)

      return entityWithId
    } catch (error) {
      this.log.error(`Failed to create ${this.tableName}`, error as Error, { entity })
      throw error
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: K, updates: Partial<T>): Promise<T> {
    try {
      const existing = await this.findById(id)
      if (!existing) {
        throw new Error(`${this.tableName} with id ${id} not found`)
      }

      const updatedEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      } as T

      const dbEntity = this.mapToDatabase(updatedEntity)
      const columns = Object.keys(dbEntity).filter(col => col !== 'id')
      const setClause = columns.map(col => `${col} = ?`).join(', ')
      const values = columns.map(col => dbEntity[col])

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
      const stmt = this.db.prepare(sql)
      stmt.run(...values, id)

      return updatedEntity
    } catch (error) {
      this.log.error(`Failed to update ${this.tableName}`, error as Error, { id, updates })
      throw error
    }
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: K): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
      const result = stmt.run(id)
      
      return result.changes > 0
    } catch (error) {
      this.log.error(`Failed to delete ${this.tableName}`, error as Error, { id })
      throw error
    }
  }

  /**
   * Count entities with optional conditions
   */
  async count(conditions: Record<string, any> = {}): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`
      const params: any[] = []

      if (Object.keys(conditions).length > 0) {
        const conditionClauses = Object.keys(conditions).map(key => `${key} = ?`)
        sql += ` WHERE ${conditionClauses.join(' AND ')}`
        params.push(...Object.values(conditions))
      }

      const stmt = this.db.prepare(sql)
      const result = stmt.get(...params) as { count: number }
      
      return result.count
    } catch (error) {
      this.log.error(`Failed to count ${this.tableName}`, error as Error, { conditions })
      throw error
    }
  }

  /**
   * Execute a raw SQL query
   */
  protected executeQuery(sql: string, params: any[] = []): any[] {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.all(...params)
    } catch (error) {
      this.log.error('Failed to execute query', error as Error, { sql, params })
      throw error
    }
  }

  /**
   * Execute a raw SQL statement
   */
  protected executeStatement(sql: string, params: any[] = []): any {
    try {
      const stmt = this.db.prepare(sql)
      return stmt.run(...params)
    } catch (error) {
      this.log.error('Failed to execute statement', error as Error, { sql, params })
      throw error
    }
  }

  /**
   * Generate a unique ID for new entities
   */
  protected generateId(): string {
    return crypto.randomUUID()
  }

  /**
   * Map database row to domain entity
   * Must be implemented by concrete repositories
   */
  protected abstract mapFromDatabase(row: any): T

  /**
   * Map domain entity to database row
   * Must be implemented by concrete repositories
   */
  protected abstract mapToDatabase(entity: T): any
}