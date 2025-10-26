/**
 * Configuration repository for app settings and secure storage
 */

import { AppSettings, AIProvider, ConfigRepository } from '@shared/types'
import { BaseRepository } from './BaseRepository.js'
import { AppDatabase } from '../database/Database.js'
import { DEFAULT_SETTINGS } from '@shared/constants'

export class ConfigRepositoryImpl implements ConfigRepository {
  private database: AppDatabase
  private log: any

  constructor(database: AppDatabase) {
    this.database = database
    this.log = new (require('../services/LogService.js').LogService)()
  }

  /**
   * Get application settings
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('SELECT key, value FROM app_settings')
      const rows = stmt.all() as { key: string; value: string }[]
      
      const settings = { ...DEFAULT_SETTINGS }
      
      for (const row of rows) {
        try {
          const value = JSON.parse(row.value)
          ;(settings as any)[row.key] = value
        } catch (error) {
          this.log.warn(`Failed to parse setting value for key: ${row.key}`, { value: row.value })
        }
      }

      return {
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AppSettings
    } catch (error) {
      this.log.error('Failed to get app settings', error as Error)
      throw error
    }
  }

  /**
   * Update application settings
   */
  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const db = this.database.getInstance()
      const updateStmt = db.prepare(`
        INSERT OR REPLACE INTO app_settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `)

      const updateTransaction = db.transaction((settings: Record<string, any>) => {
        for (const [key, value] of Object.entries(settings)) {
          if (key === 'createdAt' || key === 'updatedAt') continue
          updateStmt.run(key, JSON.stringify(value))
        }
      })

      updateTransaction(settings as Record<string, any>)
      
      return this.getAppSettings()
    } catch (error) {
      this.log.error('Failed to update app settings', error as Error, { settings })
      throw error
    }
  }

  /**
   * Get AI providers
   */
  async getAIProviders(): Promise<AIProvider[]> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('SELECT * FROM ai_providers ORDER BY display_name')
      const rows = stmt.all()
      
      return rows.map((row: any) => this.mapAIProviderFromDatabase(row))
    } catch (error) {
      this.log.error('Failed to get AI providers', error as Error)
      throw error
    }
  }

  /**
   * Save AI provider
   */
  async saveAIProvider(provider: AIProvider): Promise<AIProvider> {
    try {
      const db = this.database.getInstance()
      const dbProvider = this.mapAIProviderToDatabase(provider)
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ai_providers (
          id, name, display_name, api_key, endpoint, model, models,
          max_tokens, temperature, enabled, rate_limit, features,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        dbProvider.id, dbProvider.name, dbProvider.display_name,
        dbProvider.api_key, dbProvider.endpoint, dbProvider.model,
        dbProvider.models, dbProvider.max_tokens, dbProvider.temperature,
        dbProvider.enabled, dbProvider.rate_limit, dbProvider.features,
        dbProvider.created_at, dbProvider.updated_at
      )
      
      return provider
    } catch (error) {
      this.log.error('Failed to save AI provider', error as Error, { provider: provider.name })
      throw error
    }
  }

  /**
   * Delete AI provider
   */
  async deleteAIProvider(id: string): Promise<boolean> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('DELETE FROM ai_providers WHERE id = ?')
      const result = stmt.run(id)
      
      return result.changes > 0
    } catch (error) {
      this.log.error('Failed to delete AI provider', error as Error, { id })
      throw error
    }
  }

  /**
   * Get email accounts
   */
  async getEmailAccounts(): Promise<any[]> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('SELECT * FROM email_accounts ORDER BY name')
      const rows = stmt.all()
      
      return rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        imapHost: row.imap_host,
        imapPort: row.imap_port,
        password: row.password,
        isActive: Boolean(row.is_active),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }))
    } catch (error) {
      this.log.error('Failed to get email accounts', error as Error)
      throw error
    }
  }

  /**
   * Save email account
   */
  async saveEmailAccount(account: any): Promise<any> {
    try {
      const db = this.database.getInstance()
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO email_accounts (
          id, email, name, imap_host, imap_port, password, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      const now = new Date().toISOString()
      stmt.run(
        account.id || crypto.randomUUID(),
        account.email,
        account.name,
        account.imapHost,
        account.imapPort,
        account.password,
        account.isActive ? 1 : 0,
        account.createdAt || now,
        now
      )
      
      return account
    } catch (error) {
      this.log.error('Failed to save email account', error as Error, { email: account.email })
      throw error
    }
  }

  /**
   * Update email account
   */
  async updateEmailAccount(id: string, updates: any): Promise<any> {
    try {
      const db = this.database.getInstance()
      
      const fields = []
      const values = []
      
      if (updates.email !== undefined) {
        fields.push('email = ?')
        values.push(updates.email)
      }
      if (updates.name !== undefined) {
        fields.push('name = ?')
        values.push(updates.name)
      }
      if (updates.imapHost !== undefined) {
        fields.push('imap_host = ?')
        values.push(updates.imapHost)
      }
      if (updates.imapPort !== undefined) {
        fields.push('imap_port = ?')
        values.push(updates.imapPort)
      }
      if (updates.password !== undefined) {
        fields.push('password = ?')
        values.push(updates.password)
      }
      if (updates.isActive !== undefined) {
        fields.push('is_active = ?')
        values.push(updates.isActive ? 1 : 0)
      }
      
      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)
      
      const stmt = db.prepare(`UPDATE email_accounts SET ${fields.join(', ')} WHERE id = ?`)
      stmt.run(...values)
      
      return updates
    } catch (error) {
      this.log.error('Failed to update email account', error as Error, { id })
      throw error
    }
  }

  /**
   * Delete email account
   */
  async deleteEmailAccount(id: string): Promise<boolean> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('DELETE FROM email_accounts WHERE id = ?')
      const result = stmt.run(id)
      
      return result.changes > 0
    } catch (error) {
      this.log.error('Failed to delete email account', error as Error, { id })
      throw error
    }
  }

  /**
   * Store secure value
   */
  async setSecureValue(key: string, value: string): Promise<void> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO secure_storage (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `)
      
      stmt.run(key, value)
    } catch (error) {
      this.log.error('Failed to store secure value', error as Error, { key })
      throw error
    }
  }

  /**
   * Get secure value
   */
  async getSecureValue(key: string): Promise<string | null> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('SELECT value FROM secure_storage WHERE key = ?')
      const result = stmt.get(key) as { value: string } | undefined
      
      if (!result) {
        return null
      }

      return result.value
    } catch (error) {
      this.log.error('Failed to get secure value', error as Error, { key })
      throw error
    }
  }

  /**
   * Delete secure value
   */
  async deleteSecureValue(key: string): Promise<boolean> {
    try {
      const db = this.database.getInstance()
      const stmt = db.prepare('DELETE FROM secure_storage WHERE key = ?')
      const result = stmt.run(key)
      
      return result.changes > 0
    } catch (error) {
      this.log.error('Failed to delete secure value', error as Error, { key })
      throw error
    }
  }

  /**
   * Reset application settings to defaults
   */
  async resetAppSettings(): Promise<AppSettings> {
    try {
      const db = this.database.getInstance()
      
      // Clear existing settings
      db.prepare('DELETE FROM app_settings').run()
      
      // Insert default settings
      const insertStmt = db.prepare(`
        INSERT INTO app_settings (key, value) VALUES (?, ?)
      `)
      
      const insertDefaults = db.transaction(() => {
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
          if (key === 'createdAt' || key === 'updatedAt') continue
          insertStmt.run(key, JSON.stringify(value))
        }
      })
      
      insertDefaults()
      
      return this.getAppSettings()
    } catch (error) {
      this.log.error('Failed to reset app settings', error as Error)
      throw error
    }
  }

  /**
   * Export settings (excluding sensitive data)
   */
  async exportSettings(): Promise<any> {
    try {
      const settings = await this.getAppSettings()
      const providers = await this.getAIProviders()
      
      // Remove sensitive data
      const sanitizedProviders = providers.map(provider => ({
        ...provider,
        apiKey: undefined, // Remove API keys
      }))
      
      return {
        settings,
        aiProviders: sanitizedProviders,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }
    } catch (error) {
      this.log.error('Failed to export settings', error as Error)
      throw error
    }
  }

  /**
   * Import settings
   */
  async importSettings(data: any): Promise<void> {
    try {
      if (data.settings) {
        await this.updateAppSettings(data.settings)
      }
      
      if (data.aiProviders) {
        for (const provider of data.aiProviders) {
          // Generate new ID and don't import API keys
          const importedProvider: AIProvider = {
            ...provider,
            id: crypto.randomUUID(),
            apiKey: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await this.saveAIProvider(importedProvider)
        }
      }
    } catch (error) {
      this.log.error('Failed to import settings', error as Error)
      throw error
    }
  }

  /**
   * Map AI provider from database
   */
  private mapAIProviderFromDatabase(row: any): AIProvider {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      type: row.name, // Use name as type for compatibility
      apiKey: row.api_key,
      endpoint: row.endpoint,
      model: row.model,
      models: JSON.parse(row.models || '[]'),
      maxTokens: row.max_tokens,
      temperature: row.temperature,
      enabled: Boolean(row.enabled),
      isDefault: Boolean(row.is_default || false),
      rateLimit: row.rate_limit ? JSON.parse(row.rate_limit) : undefined,
      features: JSON.parse(row.features || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  /**
   * Map AI provider to database
   */
  private mapAIProviderToDatabase(provider: AIProvider): any {
    return {
      id: provider.id,
      name: provider.name,
      display_name: provider.displayName,
      api_key: provider.apiKey,
      endpoint: provider.endpoint,
      model: provider.model,
      models: JSON.stringify(provider.models),
      max_tokens: provider.maxTokens,
      temperature: provider.temperature,
      enabled: provider.enabled ? 1 : 0,
      rate_limit: provider.rateLimit ? JSON.stringify(provider.rateLimit) : null,
      features: JSON.stringify(provider.features),
      created_at: provider.createdAt.toISOString(),
      updated_at: provider.updatedAt.toISOString(),
    }
  }
}
