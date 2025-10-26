/**
 * Tenant Service
 * 
 * Manages multiple tenants (TekUp, Rendetalje, Foodtruck Fiesta)
 * Handles tenant configuration, credentials, and database operations
 */

import { Database } from 'better-sqlite3'
import { 
  Tenant, 
  AzureCredentials, 
  VeeamCredentials, 
  TenantDBRecord,
  SecurityPlatformError 
} from './types.js'
import { AzureCredentialManager } from './AzureCredentialManager.js'

interface TenantServiceConfig {
  database: Database
  encryptionKey?: string
}

export class TenantService {
  private db: Database
  private credentialManager: AzureCredentialManager

  constructor(config: TenantServiceConfig) {
    this.db = config.database
    this.credentialManager = new AzureCredentialManager(config.encryptionKey)
    this.initializeTables()
  }

  /**
   * Initialize database tables for tenant management
   */
  private initializeTables(): void {
    try {
      // Create tenants table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tenants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          domain TEXT NOT NULL UNIQUE,
          azure_tenant_id TEXT NOT NULL,
          graph_credentials TEXT, -- Encrypted JSON
          veeam_credentials TEXT, -- Encrypted JSON
          is_active BOOLEAN DEFAULT true,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
        CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
        CREATE INDEX IF NOT EXISTS idx_tenants_azure_id ON tenants(azure_tenant_id);
      `)

      // Create tenant_settings table for additional configuration
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tenant_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          UNIQUE(tenant_id, setting_key)
        )
      `)

      logger.info('Tenant tables initialized successfully')
    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to initialize tenant tables: ${(error as Error).message}`,
        'TENANT_TABLE_INIT_FAILED'
      )
    }
  }

  /**
   * Create a new tenant
   */
  async createTenant(tenantData: {
    id: string
    name: string
    domain: string
    azureTenantId: string
    graphCredentials?: AzureCredentials
    veeamCredentials?: VeeamCredentials
  }): Promise<Tenant> {
    try {
      const now = new Date().toISOString()
      
      // Encrypt credentials if provided
      const encryptedGraphCreds = tenantData.graphCredentials 
        ? this.credentialManager.encryptCredentials(tenantData.graphCredentials)
        : null
      
      const encryptedVeeamCreds = tenantData.veeamCredentials
        ? this.credentialManager.encryptCredentials(tenantData.veeamCredentials)
        : null

      const stmt = this.db.prepare(`
        INSERT INTO tenants (
          id, name, domain, azure_tenant_id, 
          graph_credentials, veeam_credentials, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        tenantData.id,
        tenantData.name,
        tenantData.domain,
        tenantData.azureTenantId,
        encryptedGraphCreds,
        encryptedVeeamCreds,
        now,
        now
      )

      return this.getTenantById(tenantData.id)!

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to create tenant: ${(error as Error).message}`,
        'TENANT_CREATE_FAILED'
      )
    }
  }

  /**
   * Get tenant by ID
   */
  getTenantById(tenantId: string): Tenant | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM tenants WHERE id = ? AND is_active = true
      `)
      
      const record = stmt.get(tenantId) as TenantDBRecord | undefined
      
      if (!record) {
        return null
      }

      return this.mapRecordToTenant(record)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get tenant: ${(error as Error).message}`,
        'TENANT_GET_FAILED'
      )
    }
  }

  /**
   * Get tenant by domain
   */
  getTenantByDomain(domain: string): Tenant | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM tenants WHERE domain = ? AND is_active = true
      `)
      
      const record = stmt.get(domain) as TenantDBRecord | undefined
      
      if (!record) {
        return null
      }

      return this.mapRecordToTenant(record)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get tenant by domain: ${(error as Error).message}`,
        'TENANT_GET_BY_DOMAIN_FAILED'
      )
    }
  }

  /**
   * Get all active tenants
   */
  getAllTenants(): Tenant[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM tenants WHERE is_active = true ORDER BY name
      `)
      
      const records = stmt.all() as TenantDBRecord[]
      
      return records.map(record => this.mapRecordToTenant(record))

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get all tenants: ${(error as Error).message}`,
        'TENANTS_GET_ALL_FAILED'
      )
    }
  }

  /**
   * Update tenant credentials
   */
  async updateTenantCredentials(
    tenantId: string, 
    credentials: {
      graphCredentials?: AzureCredentials
      veeamCredentials?: VeeamCredentials
    }
  ): Promise<void> {
    try {
      const updates: string[] = []
      const values: any[] = []

      if (credentials.graphCredentials) {
        updates.push('graph_credentials = ?')
        values.push(this.credentialManager.encryptCredentials(credentials.graphCredentials))
      }

      if (credentials.veeamCredentials) {
        updates.push('veeam_credentials = ?')
        values.push(this.credentialManager.encryptCredentials(credentials.veeamCredentials))
      }

      updates.push('updated_at = ?')
      values.push(new Date().toISOString())

      values.push(tenantId)

      const stmt = this.db.prepare(`
        UPDATE tenants SET ${updates.join(', ')} WHERE id = ?
      `)

      const result = stmt.run(...values)

      if (result.changes === 0) {
        throw new Error('Tenant not found or no changes made')
      }

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to update tenant credentials: ${(error as Error).message}`,
        'TENANT_UPDATE_CREDENTIALS_FAILED'
      )
    }
  }

  /**
   * Deactivate tenant (soft delete)
   */
  async deactivateTenant(tenantId: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE tenants SET is_active = false, updated_at = ? WHERE id = ?
      `)

      const result = stmt.run(new Date().toISOString(), tenantId)

      if (result.changes === 0) {
        throw new Error('Tenant not found')
      }

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to deactivate tenant: ${(error as Error).message}`,
        'TENANT_DEACTIVATE_FAILED'
      )
    }
  }

  /**
   * Get tenant setting
   */
  getTenantSetting(tenantId: string, key: string): string | null {
    try {
      const stmt = this.db.prepare(`
        SELECT setting_value FROM tenant_settings 
        WHERE tenant_id = ? AND setting_key = ?
      `)

      const result = stmt.get(tenantId, key) as { setting_value: string } | undefined

      return result?.setting_value || null

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get tenant setting: ${(error as Error).message}`,
        'TENANT_SETTING_GET_FAILED'
      )
    }
  }

  /**
   * Set tenant setting
   */
  async setTenantSetting(tenantId: string, key: string, value: string): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tenant_settings 
        (tenant_id, setting_key, setting_value, updated_at)
        VALUES (?, ?, ?, ?)
      `)

      stmt.run(tenantId, key, value, now)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to set tenant setting: ${(error as Error).message}`,
        'TENANT_SETTING_SET_FAILED'
      )
    }
  }

  /**
   * Initialize default tenants for TekUp Secure Platform
   */
  async initializeDefaultTenants(): Promise<void> {
    try {
      const defaultTenants = [
        {
          id: 'tekup',
          name: 'TekUp',
          domain: 'tekup.dk',
          azureTenantId: '' // To be configured
        },
        {
          id: 'rendetalje',
          name: 'Rendetalje',
          domain: 'rendetalje.dk',
          azureTenantId: '' // To be configured
        },
        {
          id: 'foodtruck-fiesta',
          name: 'Foodtruck Fiesta',
          domain: 'foodtruckfiesta.dk',
          azureTenantId: '' // To be configured
        }
      ]

      for (const tenant of defaultTenants) {
        const existing = this.getTenantById(tenant.id)
        if (!existing) {
          await this.createTenant(tenant)
          logger.info(`Created default tenant: ${tenant.name}`)
        }
      }

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to initialize default tenants: ${(error as Error).message}`,
        'DEFAULT_TENANTS_INIT_FAILED'
      )
    }
  }

  /**
   * Map database record to Tenant object
   */
  private mapRecordToTenant(record: TenantDBRecord): Tenant {
    let graphCredentials: AzureCredentials | undefined
    let veeamCredentials: VeeamCredentials | undefined

    if (record.graph_credentials) {
      try {
        graphCredentials = this.credentialManager.decryptCredentials(record.graph_credentials)
      } catch (error) {
        logger.warn(`Failed to decrypt graph credentials for tenant ${record.id}`)
      }
    }

    if (record.veeam_credentials) {
      try {
        veeamCredentials = this.credentialManager.decryptCredentials(record.veeam_credentials)
      } catch (error) {
        logger.warn(`Failed to decrypt veeam credentials for tenant ${record.id}`)
      }
    }

    return {
      id: record.id,
      name: record.name,
      domain: record.domain,
      azureTenantId: record.azure_tenant_id,
      isActive: Boolean(record.is_active),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      graphCredentials,
      veeamCredentials
    }
  }

  /**
   * Validate tenant configuration
   */
  async validateTenantConfig(tenantId: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      const tenant = this.getTenantById(tenantId)
      
      if (!tenant) {
        errors.push('Tenant not found')
        return { isValid: false, errors }
      }

      if (!tenant.azureTenantId) {
        errors.push('Azure Tenant ID is required')
      }

      if (!tenant.graphCredentials) {
        errors.push('Microsoft Graph credentials are required')
      } else {
        if (!tenant.graphCredentials.clientId) {
          errors.push('Graph Client ID is required')
        }
        if (!tenant.graphCredentials.clientSecret) {
          errors.push('Graph Client Secret is required')
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      }

    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`)
      return { isValid: false, errors }
    }
  }
}

export default TenantService
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-modules-shar');
