import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { TenantContextService } from '../auth/tenant-context.service';
import { LeadService } from '../lead/lead.service';
import { MetricsService } from '../metrics/metrics.service';
import { VoiceCommandRequest, VoiceCommandResponse } from '@tekup/api-client';
import { AppEvent, LeadEvent, VoiceEvent, IntegrationEvent } from '@tekup/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
@UseGuards(ApiKeyGuard)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients: Map<string, { socket: Socket; tenantId: string }> = new Map();

  constructor(
    private readonly leadService: LeadService,
    private readonly metricsService: MetricsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Events Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract tenant information from handshake
    const apiKey = client.handshake.headers['x-tenant-key'] as string;
    if (apiKey) {
      try {
        const tenantId = this.tenantContextService.resolveTenantFromApiKey(apiKey);
        this.connectedClients.set(client.id, { socket: client, tenantId });
        
        // Join tenant-specific room
        client.join(`tenant:${tenantId}`);
        
        this.logger.log(`Client ${client.id} joined tenant: ${tenantId}`);
        
        // Send welcome message
        client.emit('connected', {
          message: 'Connected to TekUp Events Gateway',
          tenantId,
          timestamp: new Date(),
        });
        
      } catch (error) {
        this.logger.error(`Failed to resolve tenant for client ${client.id}:`, error);
        client.disconnect();
      }
    } else {
      this.logger.warn(`Client ${client.id} connected without API key`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Handle voice command execution
   */
  @SubscribeMessage('execute_voice_command')
  async handleVoiceCommand(
    @MessageBody() data: VoiceCommandRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<VoiceCommandResponse> {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      return {
        success: false,
        error: 'Client not authenticated',
        tenant: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    const { tenantId } = clientInfo;
    
    try {
      this.logger.log(`Executing voice command: ${data.command} for tenant: ${tenantId}`);
      
      // Record metrics
      this.metricsService.incrementCounter('voice_commands_total', { tenant: tenantId, command: data.command });
      
      const startTime = Date.now();
      
      // Execute the command based on type
      let result: any;
      let success = true;
      let error: string | undefined;

      switch (data.command) {
        case 'get_leads':
          result = await this.handleGetLeadsCommand(data.parameters, tenantId);
          break;
          
        case 'create_lead':
          result = await this.handleCreateLeadCommand(data.parameters, tenantId);
          break;
          
        case 'search_leads':
          result = await this.handleSearchLeadsCommand(data.parameters, tenantId);
          break;
          
        case 'get_metrics':
          result = await this.handleGetMetricsCommand(data.parameters, tenantId);
          break;
          
        case 'start_backup':
          result = await this.handleStartBackupCommand(data.parameters, tenantId);
          break;
          
        case 'compliance_check':
          result = await this.handleComplianceCheckCommand(data.parameters, tenantId);
          break;
          
        default:
          success = false;
          error = `Unknown command: ${data.command}`;
          break;
      }

      const duration = Date.now() - startTime;
      
      // Record performance metrics
      this.metricsService.recordHistogram('voice_command_duration_seconds', duration / 1000, { 
        tenant: tenantId, 
        command: data.command 
      });

      // Publish voice command event
      await this.publishVoiceEvent({
        type: 'VOICE_COMMAND_EXECUTED',
        tenantId,
        source: 'flow-api',
        data: {
          command: data.command,
          parameters: data.parameters,
          response: result,
          duration,
        },
      });

      const response: VoiceCommandResponse = {
        success,
        data: result,
        error,
        tenant: tenantId,
        timestamp: new Date().toISOString(),
      };

      // Send response back to client
      client.emit('voice_command_response', response);
      
      return response;

    } catch (err) {
      this.logger.error(`Voice command execution failed:`, err);
      
      const response: VoiceCommandResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        tenant: tenantId,
        timestamp: new Date().toISOString(),
      };

      client.emit('voice_command_response', response);
      return response;
    }
  }

  /**
   * Handle get leads command
   */
  private async handleGetLeadsCommand(parameters: any, tenantId: string) {
    const { status, limit = 10, source } = parameters || {};
    
    const leads = await this.leadService.listPaginated(tenantId, {
      status,
      limit,
      source,
    });

    return {
      message: `Fandt ${leads.data.length} leads`,
      leads: leads.data,
      total: leads.data.length,
    };
  }

  /**
   * Handle create lead command
   */
  private async handleCreateLeadCommand(parameters: any, tenantId: string) {
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

    const lead = await this.leadService.create(tenantId, leadData);
    
    // Publish lead created event
    await this.publishLeadEvent({
      type: 'LEAD_CREATED',
      tenantId,
      source: 'voice-agent',
      leadId: lead.id,
      data: {
        status: lead.status,
        source: lead.source,
        payload: leadData.payload,
      },
    });

    return {
      message: `Lead oprettet for ${name} fra ${company || 'ukendt firma'}`,
      leadId: lead.id,
      lead: lead,
    };
  }

  /**
   * Handle search leads command
   */
  private async handleSearchLeadsCommand(parameters: any, tenantId: string) {
    const { query, status, date_range } = parameters || {};
    
    if (!query) {
      throw new Error('Search query is required');
    }

    const leads = await this.leadService.listPaginated(tenantId, {
      search: query,
      status,
      // TODO: Implement date range filtering
    });

    return {
      message: `Søgning efter "${query}" gav ${leads.data.length} resultater`,
      leads: leads.data,
      total: leads.data.length,
      query,
    };
  }

  /**
   * Handle get metrics command
   */
  private async handleGetMetricsCommand(parameters: any, tenantId: string) {
    const { metric_type = 'leads', period = 'month' } = parameters || {};
    
    const leads = await this.leadService.listPaginated(tenantId, { limit: 1000 });
    
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
   * Handle start backup command
   */
  private async handleStartBackupCommand(parameters: any, tenantId: string) {
    const { backup_type = 'full', priority = 'normal' } = parameters || {};
    
    // TODO: Implement actual backup functionality
    // This would typically call a backup service
    
    // Publish integration event
    await this.publishIntegrationEvent({
      type: 'SYNC_STARTED',
      tenantId,
      source: 'voice-agent',
      data: {
        operation: 'backup',
        result: { type: backup_type, priority },
      },
    });

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
   * Handle compliance check command
   */
  private async handleComplianceCheckCommand(parameters: any, tenantId: string) {
    const { check_type = 'nis2', severity = 'medium' } = parameters || {};
    
    // TODO: Implement actual compliance checking
    // This would typically call a compliance service
    
    // Publish integration event
    await this.publishIntegrationEvent({
      type: 'SYNC_STARTED',
      tenantId,
      source: 'voice-agent',
      data: {
        operation: 'compliance_check',
        result: { type: check_type, severity },
      },
    });

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
   * Publish lead event to all connected clients
   */
  async publishLeadEvent(event: Omit<LeadEvent, 'id' | 'timestamp'>) {
    const fullEvent: LeadEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Publish to tenant-specific room
    this.server.to(`tenant:${event.tenantId}`).emit('lead_event', fullEvent);
    
    this.logger.log(`Published lead event: ${event.type} for tenant: ${event.tenantId}`);
  }

  /**
   * Publish voice event to all connected clients
   */
  async publishVoiceEvent(event: Omit<VoiceEvent, 'id' | 'timestamp'>) {
    const fullEvent: VoiceEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Publish to tenant-specific room
    this.server.to(`tenant:${event.tenantId}`).emit('voice_event', fullEvent);
    
    this.logger.log(`Published voice event: ${event.type} for tenant: ${event.tenantId}`);
  }

  /**
   * Publish integration event to all connected clients
   */
  async publishIntegrationEvent(event: Omit<IntegrationEvent, 'id' | 'timestamp'>) {
    const fullEvent: IntegrationEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Publish to tenant-specific room
    this.server.to(`tenant:${event.tenantId}`).emit('integration_event', fullEvent);
    
    this.logger.log(`Published integration event: ${event.type} for tenant: ${event.tenantId}`);
  }

  /**
   * Publish any app event
   */
  async publishEvent(event: AppEvent) {
    // Publish to tenant-specific room
    this.server.to(`tenant:${event.tenantId}`).emit('app_event', event);
    
    this.logger.log(`Published app event: ${event.type} for tenant: ${event.tenantId}`);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients info
   */
  getConnectedClients() {
    return Array.from(this.connectedClients.entries()).map(([clientId, info]) => ({
      clientId,
      tenantId: info.tenantId,
      connectedAt: new Date(),
    }));
  }

  /**
   * Broadcast message to all clients in a tenant
   */
  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
    this.logger.log(`Broadcasted ${event} to tenant: ${tenantId}`);
  }
}