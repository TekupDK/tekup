/**
 * Configuration service with encrypted storage for sensitive data
 */

import { ConfigurationService, AppSettings, AIProvider, IMAPConfig } from '@shared/types'
import { ConfigRepositoryImpl } from '../repositories/ConfigRepository'
import { AppDatabase } from '../database/Database.js'
import { LogService } from './LogService.js'
import { createCipher, createDecipher } from 'crypto'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export class ConfigurationServiceImpl implements ConfigurationService {
  private configRepo: ConfigRepositoryImpl
  private log: LogService
  private encryptionKey: string
  private keyFilePath: string
  private initialized: boolean = false

  constructor(database: AppDatabase) {
    this.configRepo = new ConfigRepositoryImpl(database)
    this.log = new LogService()
    this.keyFilePath = join(app.getPath('userData'), '.encryption-key')
    this.encryptionKey = this.getOrCreateEncryptionKey()
  }

  /**
   * Initialize the configuration service
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return
      }

      // Test encryption functionality
      if (!this.testEncryption()) {
        throw new Error('Encryption test failed during initialization')
      }

      // Ensure app settings exist
      try {
        await this.getAppSettings()
      } catch (error) {
        // Create default settings if they don't exist
        await this.resetAppSettings()
      }

      this.initialized = true
      this.log.info('Configuration service initialized successfully')
    } catch (error) {
      this.log.error('Failed to initialize configuration service', error as Error)
      throw error
    }
  }

  /**
   * Get configuration value with default fallback
   */
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const settings = await this.getAppSettings()
      
      // Handle nested keys like 'sync.interval'
      const keys = key.split('.')
      let value: any = settings
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          return defaultValue as T
        }
      }
      
      return value !== undefined ? value : defaultValue as T
    } catch (error) {
      this.log.error('Failed to get configuration value', error as Error, { key })
      return defaultValue as T
    }
  }

  /**
   * Get application settings
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      return await this.configRepo.getAppSettings()
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
      return await this.configRepo.updateAppSettings(settings)
    } catch (error) {
      this.log.error('Failed to update app settings', error as Error, { settings })
      throw error
    }
  }

  /**
   * Reset application settings to defaults
   */
  async resetAppSettings(): Promise<AppSettings> {
    try {
      return await this.configRepo.resetAppSettings()
    } catch (error) {
      this.log.error('Failed to reset app settings', error as Error)
      throw error
    }
  }

  /**
   * Get AI providers
   */
  async getAIProviders(): Promise<AIProvider[]> {
    try {
      const providers = await this.configRepo.getAIProviders()
      
      // Decrypt API keys
      return providers.map(provider => ({
        ...provider,
        apiKey: provider.apiKey ? this.decrypt(provider.apiKey) : undefined
      }))
    } catch (error) {
      this.log.error('Failed to get AI providers', error as Error)
      throw error
    }
  }

  /**
   * Get specific AI provider
   */
  async getAIProvider(id: string): Promise<AIProvider | null> {
    try {
      const providers = await this.getAIProviders()
      return providers.find(p => p.id === id) || null
    } catch (error) {
      this.log.error('Failed to get AI provider', error as Error, { id })
      throw error
    }
  }

  /**
   * Save AI provider with encrypted API key
   */
  async saveAIProvider(provider: AIProvider): Promise<AIProvider> {
    try {
      // Encrypt API key before storing
      const encryptedProvider = {
        ...provider,
        apiKey: provider.apiKey ? this.encrypt(provider.apiKey) : undefined
      }

      await this.configRepo.saveAIProvider(encryptedProvider)
      
      // Return original provider with decrypted key
      return provider
    } catch (error) {
      this.log.error('Failed to save AI provider', error as Error, { providerId: provider.id })
      throw error
    }
  }

  /**
   * Delete AI provider
   */
  async deleteAIProvider(id: string): Promise<boolean> {
    try {
      return await this.configRepo.deleteAIProvider(id)
    } catch (error) {
      this.log.error('Failed to delete AI provider', error as Error, { id })
      throw error
    }
  }

  /**
   * Import settings from file
   */
  async importSettings(data: any): Promise<void> {
    try {
      await this.configRepo.importSettings(data)
      this.log.info('Settings imported successfully')
    } catch (error) {
      this.log.error('Failed to import settings', error as Error)
      throw error
    }
  }

  /**
   * Export settings to file (excluding sensitive data)
   */
  async exportSettings(): Promise<any> {
    try {
      const data = await this.configRepo.exportSettings()
      this.log.info('Settings exported successfully')
      return data
    } catch (error) {
      this.log.error('Failed to export settings', error as Error)
      throw error
    }
  }

  /**
   * Store encrypted credentials
   */
  async storeCredentials(key: string, credentials: any): Promise<void> {
    try {
      const encryptedCredentials = this.encrypt(JSON.stringify(credentials))
      await this.configRepo.setSecureValue(key, encryptedCredentials)
      
      this.log.info('Credentials stored securely', { key })
    } catch (error) {
      this.log.error('Failed to store credentials', error as Error, { key })
      throw error
    }
  }

  /**
   * Get decrypted credentials
   */
  async getCredentials(key: string): Promise<any | null> {
    try {
      const encryptedCredentials = await this.configRepo.getSecureValue(key)
      
      if (!encryptedCredentials) {
        return null
      }

      const decryptedCredentials = this.decrypt(encryptedCredentials)
      return JSON.parse(decryptedCredentials)
    } catch (error) {
      this.log.error('Failed to get credentials', error as Error, { key })
      throw error
    }
  }

  /**
   * Delete stored credentials
   */
  async deleteCredentials(key: string): Promise<boolean> {
    try {
      const result = await this.configRepo.deleteSecureValue(key)
      this.log.info('Credentials deleted', { key })
      return result
    } catch (error) {
      this.log.error('Failed to delete credentials', error as Error, { key })
      throw error
    }
  }

  /**
   * Validate IMAP configuration by testing connection
   */
  async validateIMAPConfig(config: IMAPConfig): Promise<boolean> {
    try {
      // Import IMAP dynamically to avoid loading issues
      const Imap = require('imap')
      
      return new Promise<boolean>((resolve) => {
        const imap = new Imap({
          user: config.username,
          password: config.password,
          host: config.host,
          port: config.port,
          tls: config.secure,
          tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
          connTimeout: 10000,
          authTimeout: 5000,
        })

        let resolved = false

        const cleanup = () => {
          if (!resolved) {
            resolved = true
            try {
              imap.end()
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        }

        imap.once('ready', () => {
          cleanup()
          resolve(true)
        })

        imap.once('error', (error: Error) => {
          this.log.warn('IMAP validation failed', { host: config.host, error: error.message })
          cleanup()
          resolve(false)
        })

        // Timeout after 15 seconds
        setTimeout(() => {
          cleanup()
          resolve(false)
        }, 15000)

        imap.connect()
      })
    } catch (error) {
      this.log.error('Failed to validate IMAP config', error as Error, { host: config.host })
      return false
    }
  }

  /**
   * Validate AI provider by testing API connection
   */
  async validateAIProvider(provider: AIProvider): Promise<boolean> {
    try {
      switch (provider.name) {
        case 'openai':
          return await this.validateOpenAI(provider)
        case 'anthropic':
          return await this.validateAnthropic(provider)
        case 'azure-openai':
          return await this.validateAzureOpenAI(provider)
        default:
          this.log.warn('Unknown AI provider for validation', { provider: provider.name })
          return false
      }
    } catch (error) {
      this.log.error('Failed to validate AI provider', error as Error, { provider: provider.name })
      return false
    }
  }

  /**
   * Validate OpenAI API key
   */
  private async validateOpenAI(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey) return false

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      return response.ok
    } catch (error) {
      this.log.warn('OpenAI validation failed', { error: (error as Error).message })
      return false
    }
  }

  /**
   * Validate Anthropic API key
   */
  private async validateAnthropic(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey) return false

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': provider.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
        signal: AbortSignal.timeout(10000),
      })

      // Anthropic returns 400 for invalid request format, but 401 for invalid API key
      return response.status !== 401
    } catch (error) {
      this.log.warn('Anthropic validation failed', { error: (error as Error).message })
      return false
    }
  }

  /**
   * Validate Azure OpenAI API key
   */
  private async validateAzureOpenAI(provider: AIProvider): Promise<boolean> {
    if (!provider.apiKey || !provider.endpoint) return false

    try {
      const response = await fetch(`${provider.endpoint}/openai/deployments?api-version=2023-05-15`, {
        headers: {
          'api-key': provider.apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      return response.ok
    } catch (error) {
      this.log.warn('Azure OpenAI validation failed', { error: (error as Error).message })
      return false
    }
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): string {
    try {
      if (existsSync(this.keyFilePath)) {
        return readFileSync(this.keyFilePath, 'utf8')
      }

      // Generate new encryption key
      const key = require('crypto').randomBytes(32).toString('hex')
      writeFileSync(this.keyFilePath, key, { mode: 0o600 }) // Secure file permissions
      
      this.log.info('Created new encryption key')
      return key
    } catch (error) {
      this.log.error('Failed to get/create encryption key', error as Error)
      throw error
    }
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  private encrypt(text: string): string {
    try {
      const crypto = require('crypto')
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      this.log.error('Failed to encrypt data', error as Error)
      throw error
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  private decrypt(encryptedText: string): string {
    try {
      const crypto = require('crypto')
      const parts = encryptedText.split(':')
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const encryptedData = parts[1]
      
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      this.log.error('Failed to decrypt data', error as Error)
      throw error
    }
  }

  /**
   * Change encryption key (re-encrypts all stored data)
   */
  async changeEncryptionKey(): Promise<void> {
    try {
      // Get all encrypted data
      const providers = await this.configRepo.getAIProviders()
      
      // Generate new key
      const newKey = require('crypto').randomBytes(32).toString('hex')
      const oldKey = this.encryptionKey
      
      // Update key
      this.encryptionKey = newKey
      writeFileSync(this.keyFilePath, newKey, { mode: 0o600 })
      
      // Re-encrypt all data with new key
      for (const provider of providers) {
        if (provider.apiKey) {
          // Decrypt with old key, encrypt with new key
          this.encryptionKey = oldKey
          const decryptedKey = this.decrypt(provider.apiKey)
          
          this.encryptionKey = newKey
          const reencryptedKey = this.encrypt(decryptedKey)
          
          await this.configRepo.saveAIProvider({
            ...provider,
            apiKey: reencryptedKey
          })
        }
      }
      
      this.log.info('Encryption key changed successfully')
    } catch (error) {
      this.log.error('Failed to change encryption key', error as Error)
      throw error
    }
  }

  /**
   * Get email accounts
   */
  async getEmailAccounts(): Promise<any[]> {
    try {
      const accounts = await this.configRepo.getEmailAccounts()
      
      // Decrypt passwords
      return accounts.map(account => ({
        ...account,
        password: account.password ? this.decrypt(account.password) : undefined
      }))
    } catch (error) {
      this.log.error('Failed to get email accounts', error as Error)
      throw error
    }
  }

  /**
   * Get specific email account
   */
  async getEmailAccount(id: string): Promise<any | null> {
    try {
      const accounts = await this.getEmailAccounts()
      return accounts.find(a => a.id === id) || null
    } catch (error) {
      this.log.error('Failed to get email account', error as Error, { id })
      throw error
    }
  }

  /**
   * Save email account with encrypted password
   */
  async saveEmailAccount(account: any): Promise<any> {
    try {
      // Encrypt password before storing
      const encryptedAccount = {
        ...account,
        password: account.password ? this.encrypt(account.password) : undefined
      }

      await this.configRepo.saveEmailAccount(encryptedAccount)
      
      // Return original account with decrypted password
      return account
    } catch (error) {
      this.log.error('Failed to save email account', error as Error, { accountId: account.id })
      throw error
    }
  }

  /**
   * Update email account
   */
  async updateEmailAccount(id: string, updates: any): Promise<any> {
    try {
      // Encrypt password if provided
      const encryptedUpdates = {
        ...updates,
        password: updates.password ? this.encrypt(updates.password) : updates.password
      }

      await this.configRepo.updateEmailAccount(id, encryptedUpdates)
      
      // Return updated account with decrypted password
      return await this.getEmailAccount(id)
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
      return await this.configRepo.deleteEmailAccount(id)
    } catch (error) {
      this.log.error('Failed to delete email account', error as Error, { id })
      throw error
    }
  }

  /**
   * Test email connection
   */
  async testEmailConnection(config: any): Promise<boolean> {
    try {
      // Create a minimal IMAP config for validation
      const imapConfig: IMAPConfig = {
        id: 'test',
        provider: 'generic',
        displayName: 'Test Connection',
        username: config.email,
        password: config.password,
        host: config.imapHost,
        port: config.imapPort,
        secure: config.imapPort === 993,
        syncEnabled: true,
        syncInterval: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return await this.validateIMAPConfig(imapConfig)
    } catch (error) {
      this.log.error('Failed to test email connection', error as Error)
      return false
    }
  }

  /**
   * Import configuration
   */
  async importConfig(data: any): Promise<void> {
    try {
      await this.importSettings(data)
    } catch (error) {
      this.log.error('Failed to import config', error as Error)
      throw error
    }
  }

  /**
   * Export configuration
   */
  async exportConfig(): Promise<any> {
    try {
      return await this.exportSettings()
    } catch (error) {
      this.log.error('Failed to export config', error as Error)
      throw error
    }
  }

  /**
   * Test encryption/decryption functionality
   */
  testEncryption(): boolean {
    try {
      const testData = 'test-encryption-data-' + Date.now()
      const encrypted = this.encrypt(testData)
      const decrypted = this.decrypt(encrypted)
      
      return testData === decrypted
    } catch (error) {
      this.log.error('Encryption test failed', error as Error)
      return false
    }
  }
}