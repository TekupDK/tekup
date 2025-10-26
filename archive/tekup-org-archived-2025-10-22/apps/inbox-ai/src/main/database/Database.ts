/**
 * Main Database class for AI IMAP Inbox
 * Handles SQLite connection, initialization, and migrations
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { Migration, DatabaseConfig } from '@shared/types'
import { DATABASE_CONFIG } from '@shared/constants'
import { migrations } from './migrations.js'
import { LogService } from '../services/LogService.js'

export class AppDatabase {
  private db: Database.Database | null = null
  private config: DatabaseConfig
  private log: LogService

  constructor(config?: Partial<DatabaseConfig>) {
    this.log = new LogService()
    this.config = {
      path: join(app.getPath('userData'), DATABASE_CONFIG.name),
      version: DATABASE_CONFIG.version,
      encrypted: false,
      backupEnabled: true,
      vacuumInterval: 7, // days
      walMode: true,
      cacheSize: 64, // MB
      timeout: 30000, // 30 seconds
      ...config,
    }
  }

  /**
   * Initialize the database connection and run migrations
   */
  async initialize(): Promise<void> {
    try {
      this.log.info('Initializing database', { path: this.config.path })
      
      // Ensure the directory exists
      const dbDir = join(this.config.path, '..')
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true })
      }

      // Open database connection
      this.db = new Database(this.config.path, {
        verbose: (message?: unknown) => this.log.debug('SQLite:', { message: String(message) }),
        timeout: this.config.timeout,
      })

      // Configure database settings
      this.configureDatabase()

      // Run migrations
      await this.runMigrations()

      // Set up maintenance tasks
      this.setupMaintenance()

      this.log.info('Database initialized successfully')
    } catch (error) {
      this.log.error('Failed to initialize database', error as Error)
      throw error
    }
  }

  /**
   * Configure database settings for optimal performance
   */
  private configureDatabase(): void {
    if (!this.db) throw new Error('Database not initialized')

    // Enable WAL mode for better concurrency
    if (this.config.walMode) {
      this.db.pragma('journal_mode = WAL')
    }

    // Set cache size
    this.db.pragma(`cache_size = ${this.config.cacheSize * 1024}`) // Convert MB to pages

    // Enable foreign key constraints
    this.db.pragma('foreign_keys = ON')

    // Set synchronous mode for balance of safety and performance
    this.db.pragma('synchronous = NORMAL')

    // Set page size for optimal performance
    this.db.pragma('page_size = 4096')

    // Enable memory-mapped I/O
    this.db.pragma('mmap_size = 268435456') // 256MB

    // Set temp store to memory
    this.db.pragma('temp_store = MEMORY')

    this.log.debug('Database configured with optimized settings')
  }

  /**
   * Create migrations table if it doesn't exist
   */
  private createMigrationsTable(): void {
    if (!this.db) throw new Error('Database not initialized')

    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    this.db.exec(createMigrationsTable)
  }

  /**
   * Get the current database version
   */
  private getCurrentVersion(): number {
    if (!this.db) throw new Error('Database not initialized')

    this.createMigrationsTable()
    
    const result = this.db
      .prepare('SELECT MAX(version) as version FROM migrations')
      .get() as { version: number | null }
    
    return result.version || 0
  }

  /**
   * Run pending migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const currentVersion = this.getCurrentVersion()
    const pendingMigrations = migrations.filter((m: Migration) => m.version > currentVersion)

    if (pendingMigrations.length === 0) {
      this.log.info('No pending migrations')
      return
    }

    this.log.info(`Running ${pendingMigrations.length} migrations`, {
      from: currentVersion,
      to: Math.max(...pendingMigrations.map((m: Migration) => m.version))
    })

    // Run migrations in a transaction
    const runMigration = this.db.transaction((migration: Migration) => {
      try {
        // Execute the migration SQL
        this.db!.exec(migration.sql)
        
        // Record the migration
        this.db!
          .prepare('INSERT INTO migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name)
        
        this.log.info(`Migration completed: ${migration.name}`)
      } catch (error) {
        this.log.error(`Migration failed: ${migration.name}`, error as Error)
        throw error
      }
    })

    // Execute all pending migrations
    for (const migration of pendingMigrations.sort((a: Migration, b: Migration) => a.version - b.version)) {
      runMigration(migration)
    }

    this.log.info('All migrations completed successfully')
  }

  /**
   * Setup database maintenance tasks
   */
  private setupMaintenance(): void {
    // Run VACUUM periodically to optimize database
    const vacuumInterval = this.config.vacuumInterval * 24 * 60 * 60 * 1000 // Convert days to ms
    
    setInterval(() => {
      this.vacuum()
    }, vacuumInterval)

    // Run ANALYZE to update statistics
    setTimeout(() => {
      this.analyze()
    }, 60000) // Run after 1 minute
  }

  /**
   * Vacuum the database to reclaim space and optimize
   */
  vacuum(): void {
    if (!this.db) return

    try {
      this.log.info('Starting database vacuum')
      const start = Date.now()
      
      this.db.exec('VACUUM')
      
      const duration = Date.now() - start
      this.log.info('Database vacuum completed', { duration })
    } catch (error) {
      this.log.error('Database vacuum failed', error as Error)
    }
  }

  /**
   * Analyze the database to update statistics
   */
  analyze(): void {
    if (!this.db) return

    try {
      this.log.debug('Running database analyze')
      this.db.exec('ANALYZE')
    } catch (error) {
      this.log.error('Database analyze failed', error as Error)
    }
  }

  /**
   * Get database statistics
   */
  getStats(): any {
    if (!this.db) return null

    try {
      const pageCount = this.db.pragma('page_count', { simple: true }) as number
      const pageSize = this.db.pragma('page_size', { simple: true }) as number
      const freePages = this.db.pragma('freelist_count', { simple: true }) as number
      const walSize = this.db.pragma('wal_checkpoint', { simple: true }) as number

      return {
        totalSize: pageCount * pageSize,
        usedSize: (pageCount - freePages) * pageSize,
        freeSize: freePages * pageSize,
        walSize,
        pageCount,
        pageSize,
        freePages,
        utilization: ((pageCount - freePages) / pageCount) * 100,
      }
    } catch (error) {
      this.log.error('Failed to get database stats', error as Error)
      return null
    }
  }

  /**
   * Create a backup of the database
   */
  async backup(backupPath?: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const defaultBackupPath = join(
      app.getPath('userData'),
      'backups',
      `backup-${timestamp}.db`
    )
    
    const targetPath = backupPath || defaultBackupPath

    try {
      // Ensure backup directory exists
      const backupDir = join(targetPath, '..')
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true })
      }

      // Create backup using file copy (better-sqlite3 doesn't have streaming backup)
      const fs = require('fs')
      fs.copyFileSync(this.config.path, targetPath)

      this.log.info('Database backup created', { path: targetPath })
      return targetPath
    } catch (error) {
      this.log.error('Database backup failed', error as Error)
      throw error
    }
  }

  /**
   * Restore database from backup
   */
  async restore(backupPath: string): Promise<void> {
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    try {
      // Close current connection
      this.close()

      // Copy backup file to current database path
      const fs = require('fs')
      fs.copyFileSync(backupPath, this.config.path)

      // Reinitialize database
      await this.initialize()

      this.log.info('Database restored from backup', { backupPath })
    } catch (error) {
      this.log.error('Database restore failed', error as Error)
      throw error
    }
  }

  /**
   * Execute a prepared statement
   */
  prepare(sql: string): Database.Statement {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.prepare(sql)
  }

  /**
   * Execute SQL directly
   */
  exec(sql: string): void {
    if (!this.db) throw new Error('Database not initialized')
    this.db.exec(sql)
  }

  /**
   * Start a transaction
   */
  transaction<T extends (...args: any[]) => any>(fn: T): Database.Transaction<T> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.transaction(fn) as Database.Transaction<T>
  }

  /**
   * Get the raw database instance
   */
  getInstance(): Database.Database {
    if (!this.db) throw new Error('Database not initialized')
    return this.db
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.db !== null && this.db.open
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close()
        this.log.info('Database connection closed')
      } catch (error) {
        this.log.error('Error closing database', error as Error)
      } finally {
        this.db = null
      }
    }
  }

  /**
   * Get database configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config }
  }
}

// Export singleton instance
let dbInstance: AppDatabase | null = null

export const getDatabase = (): AppDatabase => {
  if (!dbInstance) {
    dbInstance = new AppDatabase()
  }
  return dbInstance
}

export const initializeDatabase = async (config?: Partial<DatabaseConfig>): Promise<AppDatabase> => {
  if (!dbInstance) {
    dbInstance = new AppDatabase(config)
  }
  
  if (!dbInstance.isConnected()) {
    await dbInstance.initialize()
  }
  
  return dbInstance
}