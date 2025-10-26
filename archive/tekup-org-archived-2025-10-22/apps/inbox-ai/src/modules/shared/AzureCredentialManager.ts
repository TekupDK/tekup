/**
 * Azure Credential Manager
 * 
 * Handles secure storage and encryption of Azure and API credentials
 * Used for protecting Microsoft Graph and Veeam API credentials
 */

import * as crypto from 'crypto'
import { AzureCredentials, VeeamCredentials, SecurityPlatformError } from './types.js'

interface EncryptedCredentials {
  data: string
  iv: string
  authTag: string
}

export class AzureCredentialManager {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  private readonly ivLength = 16
  private readonly tagLength = 16
  private encryptionKey: Buffer

  constructor(encryptionKey?: string) {
    if (encryptionKey) {
      this.encryptionKey = this.deriveKey(encryptionKey)
    } else {
      // Generate a random key if none provided
      this.encryptionKey = crypto.randomBytes(this.keyLength)
      logger.warn('No encryption key provided, using random key. Credentials will not persist across restarts.')
    }
  }

  /**
   * Derive encryption key from password
   */
  private deriveKey(password: string): Buffer {
    // Use a fixed salt for consistent key derivation
    const salt = Buffer.from('tekup-secure-platform-salt', 'utf8')
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256')
  }

  /**
   * Encrypt credentials
   */
  encryptCredentials(credentials: AzureCredentials | VeeamCredentials): string {
    try {
      const plaintext = JSON.stringify(credentials)
      const iv = crypto.randomBytes(this.ivLength)
      
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey)
      cipher.setAAD(Buffer.from('tekup-credentials'))

      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()

      const result: EncryptedCredentials = {
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      }

      return Buffer.from(JSON.stringify(result)).toString('base64')

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to encrypt credentials: ${(error as Error).message}`,
        'CREDENTIAL_ENCRYPT_FAILED'
      )
    }
  }

  /**
   * Decrypt credentials
   */
  decryptCredentials(encryptedData: string): AzureCredentials | VeeamCredentials {
    try {
      const encryptedJson = Buffer.from(encryptedData, 'base64').toString('utf8')
      const encrypted: EncryptedCredentials = JSON.parse(encryptedJson)

      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey)
      decipher.setAAD(Buffer.from('tekup-credentials'))
      decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'))

      let decrypted = decipher.update(encrypted.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to decrypt credentials: ${(error as Error).message}`,
        'CREDENTIAL_DECRYPT_FAILED'
      )
    }
  }

  /**
   * Validate Azure credentials format
   */
  validateAzureCredentials(credentials: AzureCredentials): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!credentials.tenantId || credentials.tenantId.trim().length === 0) {
      errors.push('Tenant ID is required')
    }

    if (!credentials.clientId || credentials.clientId.trim().length === 0) {
      errors.push('Client ID is required')
    }

    if (!credentials.clientSecret || credentials.clientSecret.trim().length === 0) {
      errors.push('Client Secret is required')
    }

    // Validate GUID format for tenantId and clientId
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (credentials.tenantId && !guidRegex.test(credentials.tenantId)) {
      errors.push('Tenant ID must be a valid GUID')
    }

    if (credentials.clientId && !guidRegex.test(credentials.clientId)) {
      errors.push('Client ID must be a valid GUID')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate Veeam credentials format
   */
  validateVeeamCredentials(credentials: VeeamCredentials): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!credentials.serverUrl || credentials.serverUrl.trim().length === 0) {
      errors.push('Server URL is required')
    }

    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      errors.push('API Key is required')
    }

    // Validate URL format
    if (credentials.serverUrl) {
      try {
        new URL(credentials.serverUrl)
      } catch {
        errors.push('Server URL must be a valid URL')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate secure random API key
   */
  generateSecureApiKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Hash sensitive data for comparison (without storing plaintext)
   */
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Create encrypted storage for credentials with metadata
   */
  createCredentialPackage(
    credentials: AzureCredentials | VeeamCredentials,
    metadata: {
      tenantId: string
      credentialType: 'azure' | 'veeam'
      createdAt?: Date
      lastUsed?: Date
    }
  ): string {
    try {
      const package_ = {
        credentials,
        metadata: {
          ...metadata,
          createdAt: metadata.createdAt || new Date(),
          lastUsed: metadata.lastUsed || new Date()
        }
      }

      return this.encryptCredentials(package_ as any)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to create credential package: ${(error as Error).message}`,
        'CREDENTIAL_PACKAGE_FAILED'
      )
    }
  }

  /**
   * Extract credentials from encrypted package
   */
  extractCredentialPackage(encryptedPackage: string): {
    credentials: AzureCredentials | VeeamCredentials
    metadata: any
  } {
    try {
      const package_ = this.decryptCredentials(encryptedPackage) as any
      
      return {
        credentials: package_.credentials,
        metadata: package_.metadata
      }

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to extract credential package: ${(error as Error).message}`,
        'CREDENTIAL_EXTRACT_FAILED'
      )
    }
  }

  /**
   * Test credential encryption/decryption
   */
  testEncryption(): boolean {
    try {
      const testCredentials: AzureCredentials = {
        tenantId: '12345678-1234-1234-1234-123456789012',
        clientId: '87654321-4321-4321-4321-210987654321',
        clientSecret: 'test-secret-123',
        scope: 'https://graph.microsoft.com/.default'
      }

      const encrypted = this.encryptCredentials(testCredentials)
      const decrypted = this.decryptCredentials(encrypted) as AzureCredentials

      return (
        decrypted.tenantId === testCredentials.tenantId &&
        decrypted.clientId === testCredentials.clientId &&
        decrypted.clientSecret === testCredentials.clientSecret
      )

    } catch (error) {
      logger.error('Encryption test failed:', error)
      return false
    }
  }

  /**
   * Securely wipe credentials from memory (best effort)
   */
  secureWipe(obj: any): void {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Overwrite string with random data
          obj[key] = crypto.randomBytes(obj[key].length).toString('hex')
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          this.secureWipe(obj[key])
        }
      }
    }
  }

  /**
   * Get encryption key fingerprint for verification
   */
  getKeyFingerprint(): string {
    return crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 16)
  }
}

export default AzureCredentialManager
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-modules-shar');
