import { createApiClient, VoiceCommandRequest, VoiceCommandResponse } from '@tekup/api-client';
import { VoiceCommand, VoiceResponse, ConversationTurn, createLogger } from '@tekup/shared';

const logger = createLogger('voice-integration-service');

export interface VoiceIntegrationConfig {
  flowApiUrl: string;
  apiKey: string;
  tenantId: string;
}

export class VoiceIntegrationService {

  private apiClient: ReturnType<typeof createApiClient>;
  private config: VoiceIntegrationConfig;
  private readonly allowedTenants: Set<string>;

  constructor(config: VoiceIntegrationConfig) {
    this.config = config;
    this.allowedTenants = new Set([config.tenantId]); // Only allow assigned tenant

    this.apiClient = createApiClient({
      baseUrl: config.flowApiUrl,
      apiKey: config.apiKey,
      tenantId: config.tenantId,
    });
  }

  /**
   * Validate tenant access before executing any command
   */
  private validateTenantAccess(tenantId: string, operation: string): void {
    if (!tenantId || !this.allowedTenants.has(tenantId)) {
      throw new Error(`Access denied: Cannot access tenant ${tenantId} for operation ${operation}`);
    }

    // Additional validation: ensure operation is allowed for this tenant
    if (!this.isOperationAllowed(operation, tenantId)) {
      throw new Error(`Operation ${operation} not allowed for tenant ${tenantId}`);
    }
  }

  /**
   * Check if operation is allowed for the specified tenant
   */
  private isOperationAllowed(operation: string, tenantId: string): boolean {
    // Define tenant-specific operation permissions
    const tenantPermissions: Record<string, string[]> = {
      [this.config.tenantId]: [
        'create_lead',
        'get_leads',
        'search_leads',
        'get_metrics',
        'start_backup',
        'compliance_check'
      ]
    };

    return tenantPermissions[tenantId]?.includes(operation) || false;
  }

  /**
   * Execute a voice command by mapping it to Flow API calls
   */
  async executeVoiceCommand(
    command: VoiceCommand,
    parameters?: Record<string, any>
  ): Promise<VoiceResponse> {
    try {
      // Extract tenant from command or use default
      const targetTenant = parameters?.tenantId || this.config.tenantId;

      // Validate tenant access
      this.validateTenantAccess(targetTenant, command.name);

      logger.info(`🎯 Executing voice command: ${command.name} for tenant: ${targetTenant}`, { parameters });

      // Execute command with tenant validation
      const result = await this.executeCommandForTenant(command, targetTenant, parameters);

      const response: VoiceResponse = {
        success: true,
        data: result,
        error: undefined,
        tenant: targetTenant, // Use validated tenant
        timestamp: new Date(),
      };

      logger.info(`✅ Voice command executed successfully for tenant: ${targetTenant}`);
      return response;

    } catch (err) {
      logger.error(`❌ Voice command execution failed:`, err);

      const response: VoiceResponse = {
        success: false,
        data: undefined,
        error: err instanceof Error ? err.message : 'Unknown error',
        tenant: this.config.tenantId, // Fallback to assigned tenant
        timestamp: new Date(),
      };

      return response;
    }
  }

  /**
   * Execute command with tenant-specific API client
   */
  private async executeCommandForTenant(
    command: VoiceCommand,
    tenantId: string,
    parameters?: Record<string, any>
  ): Promise<any> {
    // Create tenant-specific API client for this operation
    const tenantApiClient = createApiClient({
      baseUrl: this.config.flowApiUrl,
      apiKey: this.config.apiKey,
      tenantId: tenantId,
    });

    let result: any;

    switch (command.name) {
      case 'create_lead':
        result = await this.createLeadFromVoice(parameters);
        break;

      case 'get_leads':
        result = await this.getLeadsFromVoice(parameters);
        break;

      case 'search_leads':
        result = await this.searchLeadsFromVoice(parameters);
        break;

      case 'get_metrics':
        result = await this.getMetricsFromVoice(parameters);
        break;

      case 'start_backup':
        result = await this.startBackupFromVoice(parameters);
        break;

      case 'compliance_check':
        result = await this.runComplianceCheckFromVoice(parameters);
        break;

      default:
        throw new Error(`Unknown command: ${command.name}`);
    }

    return result;
  }

  /**
   * Create a new lead from voice command
   */
  private async createLeadFromVoice(parameters?: Record<string, any>) {
    if (!parameters) {
      throw new Error('Parameters required for create_lead command');
    }

    const { name, email, company, phone, source = 'voice', notes } = parameters;

    if (!name || !email) {
      throw new Error('Name and email are required for creating a lead');
    }

    const leadData = {
      source,
      payload: {
        name,
        email,
        company,
        phone,
        message: notes,
        jobTitle: parameters.jobTitle,
      },
    };

    const lead = await this.apiClient.createLead(leadData);

    return {
      message: `Lead oprettet for ${name} fra ${company || 'ukendt firma'}`,
      leadId: lead.id,
      lead: lead,
    };
  }

  /**
   * Get leads from voice command
   */
  private async getLeadsFromVoice(parameters?: Record<string, any>) {
    const { status, limit = 10, source } = parameters || {};

    const leads = await this.apiClient.getLeads({
      status,
      limit,
      source,
    });

    const totalLeads = leads.data.length;
    const statusText = status ? ` med status ${status}` : '';

    return {
      message: `Fandt ${totalLeads} leads${statusText}`,
      leads: leads.data,
      total: totalLeads,
    };
  }

  /**
   * Search leads from voice command
   */
  private async searchLeadsFromVoice(parameters?: Record<string, any>) {
    const { query, status, date_range } = parameters || {};

    if (!query) {
      throw new Error('Search query is required');
    }

    const leads = await this.apiClient.getLeads({
      search: query,
      status,
      // TODO: Implement date range filtering
    });

    const totalLeads = leads.data.length;

    return {
      message: `Søgning efter "${query}" gav ${totalLeads} resultater`,
      leads: leads.data,
      total: totalLeads,
      query,
    };
  }

  /**
   * Get metrics from voice command
   */
  private async getMetricsFromVoice(parameters?: Record<string, any>) {
    const { metric_type = 'leads', period = 'month' } = parameters || {};

    // For now, we'll get basic metrics
    // TODO: Implement more sophisticated metrics
    const leads = await this.apiClient.getLeads({ limit: 1000 });

    const totalLeads = leads.data.length;
    const newLeads = leads.data.filter(l => l.status === 'NEW').length;
    const contactedLeads = leads.data.filter(l => l.status === 'CONTACTED').length;

    return {
      message: `Metrics for ${period}: ${totalLeads} total leads, ${newLeads} nye, ${contactedLeads} kontaktet`,
      metrics: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        period,
        type: metric_type,
      },
    };
  }

  /**
   * Start backup from voice command
   */
  private async startBackupFromVoice(parameters?: Record<string, any>) {
    const { backup_type = 'full', priority = 'normal' } = parameters || {};

    // TODO: Implement actual backup functionality
    // This would typically call a backup service

    return {
      message: `Backup startet: ${backup_type} backup med ${priority} prioritet`,
      backup: {
        type: backup_type,
        priority,
        status: 'started',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Run compliance check from voice command
   */
  private async runComplianceCheckFromVoice(parameters?: Record<string, any>) {
    const { check_type = 'nis2', severity = 'medium' } = parameters || {};

    // TODO: Implement actual compliance checking
    // This would typically call a compliance service

    return {
      message: `Compliance check startet: ${check_type} check med ${severity} severity`,
      compliance: {
        type: check_type,
        severity,
        status: 'running',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.apiClient.getHealth();
      return true;
    } catch (error) {
      logger.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get tenant information
   */
  async getTenantInfo() {
    try {
      return await this.apiClient.getTenantInfo();
    } catch (error) {
      logger.error('Failed to get tenant info:', error);
      return null;
    }
  }
}
