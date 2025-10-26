/**
 * Flow Ingestion Integration Service for TekUp Flow platform
 * Handles lead & compliance forwarding to TekUp Flow API.
 *
 * Migration strategy:
 * Handles lead & compliance forwarding to TekUp Flow API with robust retry logic.
 */
// Removed EventEmitter inheritance and emit calls
import { LogService } from './LogService'
import { ConfigurationServiceImpl } from './ConfigurationService'
import {
  FlowIngestionConfig,
  FlowIngestionLead,
  FlowIngestionComplianceLead,
  FlowIngestionApiResponse,
  Lead,
  SecurityAlert,
  ComplianceStatus
} from '../../modules/shared/types'
import { AppSettings } from '../../shared/types/config'
import { AppError } from '../../shared/types'

export interface FlowIngestionServiceConfig {
  apiUrl: string
  defaultTenant: string
  retryAttempts: number
  timeoutMs: number
}

export class FlowIngestionService {
  private log: LogService
  private config: ConfigurationServiceImpl
  private serviceConfig: FlowIngestionServiceConfig
  private isInitialized = false
  private tenantMappings: Map<string, string> = new Map()

  constructor(config: ConfigurationServiceImpl, serviceConfig: FlowIngestionServiceConfig) {
  // Removed super() call as EventEmitter is no longer inherited
    this.config = config
    this.serviceConfig = serviceConfig
    this.log = new LogService()
    this.tenantMappings.set('tekup', 'tekup')
  }

  async initialize(): Promise<void> {
    try {
      this.log.info('Initializing Flow Ingestion Service')
      const ingestionCfg = await this.loadFlowIngestionConfig()
      if (ingestionCfg) this.updateTenantMappings(ingestionCfg.tenantMappings)
      await this.testConnection()
      this.isInitialized = true
      this.log.info('Flow Ingestion Service initialized')
  // event hook placeholder (initialized)
    } catch (e) {
      this.log.error('Failed to initialize Flow Ingestion Service', e as Error)
      throw e
    }
  }

  async configureTenantMapping(tenantKey: string, flowTenant: string): Promise<void> {
    try {
      this.tenantMappings.set(tenantKey, flowTenant)
      const settings = await this.config.getAppSettings()
      if (!settings.flowIngestion) {
        // Initialize new flow ingestion config
        settings.flowIngestion = {
          apiUrl: this.serviceConfig.apiUrl,
          tenantMappings: {},
          retryAttempts: this.serviceConfig.retryAttempts,
          timeoutMs: this.serviceConfig.timeoutMs,
          enabled: true
        }
      }
      settings.flowIngestion.tenantMappings[tenantKey] = flowTenant
      await this.config.updateAppSettings(settings)
      this.log.info(`Flow tenant mapping configured: ${tenantKey} -> ${flowTenant}`)
  // event hook placeholder (tenantMappingConfigured)
    } catch (e) {
      this.log.error('Failed to configure flow tenant mapping', e as Error)
      throw new AppError('Failed to configure flow tenant mapping', 'TENANT_MAPPING_FAILED')
    }
  }

  async forwardLead(lead: Lead, emailId?: string, tenantId?: string): Promise<FlowIngestionApiResponse> {
    if (!this.isInitialized) throw new Error('Flow Ingestion Service not initialized')
    this.log.debug('Forwarding lead to Flow ingestion', { leadId: lead.id, tenantId })
    const mapped: FlowIngestionLead = {
      source: 'tekup-imap',
      payload: {
        company: lead.company,
        contact: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        service: lead.serviceInterest,
        location: lead.location,
        budget: lead.budgetRange,
        notes: lead.notes,
        priority: lead.priority
      },
      metadata: {
        confidence: lead.confidence,
        timestamp: new Date().toISOString(),
        emailId,
        tenantId: tenantId || this.serviceConfig.defaultTenant
      }
    }
    const resp = await this.sendLead(mapped, tenantId)
  // event hook placeholder (leadForwarded)
    return resp
  }

  async forwardComplianceFinding(alert: SecurityAlert, tenantId?: string): Promise<FlowIngestionApiResponse> {
    if (!this.isInitialized) throw new Error('Flow Ingestion Service not initialized')
    this.log.debug('Forwarding compliance finding', { alertId: alert.id, type: alert.type })
    const comp: FlowIngestionComplianceLead = {
      type: this.mapAlertType(alert.type),
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      recommendation: alert.recommendation,
      affectedSystems: alert.affectedSystems,
      metadata: {
        scanId: alert.scanId || alert.id,
        timestamp: alert.detectedAt.toISOString(),
        tenantId: tenantId || this.serviceConfig.defaultTenant,
        riskScore: alert.riskScore
      },
      companyName: 'TekUp Client',
      contactEmail: 'contact@tekup.dk'
    }
    const resp = await this.sendCompliance(comp, tenantId)
  // event hook placeholder (complianceForwarded)
    return resp
  }

  private async sendLead(lead: FlowIngestionLead, tenantId?: string): Promise<FlowIngestionApiResponse> {
    const tenant = tenantId || this.serviceConfig.defaultTenant
    const tenantKey = this.tenantMappings.get(tenant) || tenant
    return this.makeApiCall('/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-key': tenantKey },
      body: JSON.stringify(lead)
    })
  }
  private async sendCompliance(lead: FlowIngestionComplianceLead, tenantId?: string): Promise<FlowIngestionApiResponse> {
    const tenant = tenantId || this.serviceConfig.defaultTenant
    const tenantKey = this.tenantMappings.get(tenant) || tenant
    return this.makeApiCall('/leads/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-key': tenantKey },
      body: JSON.stringify(lead)
    })
  }

  private async makeApiCall(endpoint: string, options: RequestInit): Promise<FlowIngestionApiResponse> {
    const url = `${this.serviceConfig.apiUrl}${endpoint}`
    let last: Error | null = null
    for (let attempt = 1; attempt <= this.serviceConfig.retryAttempts; attempt++) {
      try {
        this.log.debug(`Flow API call attempt ${attempt}`, { endpoint })
        const controller = new AbortController()
        const to = setTimeout(() => controller.abort(), this.serviceConfig.timeoutMs)
        const resp = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(to)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        return { success: true, leadId: data.id || data.leadId, message: data.message }
      } catch (e) {
        last = e as Error
        if (attempt < this.serviceConfig.retryAttempts) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
      }
    }
    return { success: false, message: last?.message || 'Unknown error', errors: [last?.message || 'retry_exhausted'] }
  }

  async testConnection(): Promise<boolean> {
    const res = await this.makeApiCall('/health', { method: 'GET', headers: { 'x-tenant-key': this.tenantMappings.get(this.serviceConfig.defaultTenant) || this.serviceConfig.defaultTenant } })
    if (!res.success) {
      this.log.warn('Flow ingestion connection test failed')
      return false
    }
    this.log.info('Flow ingestion connection ok')
    return true
  }

  private async loadFlowIngestionConfig(): Promise<FlowIngestionConfig | null> {
    try {
      const s = await this.config.getAppSettings()
      return s.flowIngestion || null
    } catch (e) {
      this.log.warn('Failed to load flow ingestion config', e as Error)
      return null
    }
  }

  private updateTenantMappings(m: Record<string,string>): void {
    for (const [k,v] of Object.entries(m)) this.tenantMappings.set(k,v)
  }

  private mapAlertType(alertType: string): FlowIngestionComplianceLead['type'] {
    switch (alertType.toLowerCase()) {
      case 'nis2_compliance':
      case 'nis2_violation': return 'nis2_finding'
      case 'copilot_risk':
      case 'copilot_exposure': return 'copilot_risk'
      case 'backup_failure':
      case 'backup_missing': return 'backup_failure'
      default: return 'security_alert'
    }
  }

  async getStatus(): Promise<{ initialized:boolean; connected:boolean; tenantMappings:Record<string,string>; config:FlowIngestionServiceConfig }> {
    return { initialized: this.isInitialized, connected: this.isInitialized, tenantMappings: Object.fromEntries(this.tenantMappings), config: this.serviceConfig }
  }

  async updateConfig(newConfig: Partial<FlowIngestionServiceConfig>): Promise<void> {
    this.serviceConfig = { ...this.serviceConfig, ...newConfig }
    this.log.info('Flow ingestion config updated', { config: this.serviceConfig })
  // event hook placeholder (configUpdated)
  }

  async shutdown(): Promise<void> {
    this.log.info('Shutting down Flow Ingestion Service')
    this.isInitialized = false
  // event hook placeholder (shutdown)
  }
}

// Flow ingestion service fully integrated with TekUp platform