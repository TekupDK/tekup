import { createLogger } from './simple-logger.js';
import { ServiceRegistry } from './service-registry.js';
import { ServiceHealth, ServiceStatus } from './types.js';

export class IncidentResponseSystem {
  private logger = createLogger('incident-response');
  private incidents = new Map<string, Incident>();
  private escalationRules: EscalationRule[] = [];
  private responseActions: ResponseAction[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    private registry: ServiceRegistry,
    private config: IncidentResponseConfig = {}
  ) {
    this.setupDefaultEscalationRules();
    this.setupDefaultResponseActions();
  }

  /**
   * Start incident monitoring
   */
  async start(): Promise<void> {
    // Monitor for incidents every minute
    this.monitoringInterval = setInterval(async () => {
      await this.checkForIncidents();
    }, 60000);

    this.logger.info('Incident response system started');
  }

  /**
   * Stop incident monitoring
   */
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.logger.info('Incident response system stopped');
  }

  /**
   * Add custom escalation rule
   */
  addEscalationRule(rule: EscalationRule): void {
    this.escalationRules.push(rule);
    this.logger.info(`Added escalation rule: ${rule.name}`);
  }

  /**
   * Add custom response action
   */
  addResponseAction(action: ResponseAction): void {
    this.responseActions.push(action);
    this.logger.info(`Added response action: ${action.name}`);
  }

  /**
   * Manually create an incident
   */
  async createIncident(
    serviceId: string,
    severity: IncidentSeverity,
    description: string,
    metadata?: Record<string, any>
  ): Promise<Incident> {
    const incident: Incident = {
      id: this.generateIncidentId(),
      serviceId,
      severity,
      status: 'open',
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: metadata || {},
      timeline: [{
        timestamp: new Date(),
        action: 'created',
        description: 'Incident created',
        actor: 'system'
      }]
    };

    this.incidents.set(incident.id, incident);
    await this.processIncident(incident);
    
    this.logger.warn(`Incident created: ${incident.id} - ${description}`);
    return incident;
  }

  /**
   * Update incident status
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<Incident>,
    actor = 'system'
  ): Promise<Incident | undefined> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      this.logger.error(`Incident not found: ${incidentId}`);
      return undefined;
    }

    const oldStatus = incident.status;
    Object.assign(incident, updates, { updatedAt: new Date() });

    // Add timeline entry
    incident.timeline.push({
      timestamp: new Date(),
      action: 'updated',
      description: `Status changed from ${oldStatus} to ${incident.status}`,
      actor,
      changes: updates
    });

    // If incident is resolved, stop escalation
    if (incident.status === 'resolved') {
      await this.resolveIncident(incident);
    }

    this.logger.info(`Incident updated: ${incidentId} - ${incident.status}`);
    return incident;
  }

  /**
   * Get all incidents
   */
  getIncidents(filters?: IncidentFilters): Incident[] {
    let incidents = Array.from(this.incidents.values());

    if (filters) {
      if (filters.serviceId) {
        incidents = incidents.filter(i => i.serviceId === filters.serviceId);
      }
      if (filters.severity) {
        incidents = incidents.filter(i => i.severity === filters.severity);
      }
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      if (filters.since) {
        incidents = incidents.filter(i => i.createdAt >= filters.since!);
      }
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get incident statistics
   */
  getIncidentStats(timeframe?: { start: Date; end: Date }): IncidentStats {
    let incidents = Array.from(this.incidents.values());

    if (timeframe) {
      incidents = incidents.filter(i => 
        i.createdAt >= timeframe.start && i.createdAt <= timeframe.end
      );
    }

    const stats: IncidentStats = {
      total: incidents.length,
      open: incidents.filter(i => i.status === 'open').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      bySeverity: {
        critical: incidents.filter(i => i.severity === 'critical').length,
        high: incidents.filter(i => i.severity === 'high').length,
        medium: incidents.filter(i => i.severity === 'medium').length,
        low: incidents.filter(i => i.severity === 'low').length
      },
      averageResolutionTime: this.calculateAverageResolutionTime(incidents),
      mttr: this.calculateMTTR(incidents) // Mean Time To Recovery
    };

    return stats;
  }

  /**
   * Check for new incidents based on service health
   */
  private async checkForIncidents(): Promise<void> {
    try {
      const healthData = await this.registry.getAllServiceHealth();
      
      for (const [serviceId, health] of healthData) {
        await this.evaluateServiceHealth(serviceId, health);
      }
    } catch (error) {
      this.logger.error('Error checking for incidents:', error);
    }
  }

  /**
   * Evaluate service health and create incidents if needed
   */
  private async evaluateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void> {
    const service = this.registry.getService(serviceId);
    if (!service || !service.enabled) return;

    // Check if there's already an open incident for this service
    const existingIncident = Array.from(this.incidents.values())
      .find(i => i.serviceId === serviceId && i.status !== 'resolved');

    if (health.status === 'healthy') {
      // If service is healthy but has an open incident, resolve it
      if (existingIncident) {
        await this.updateIncident(existingIncident.id, {
          status: 'resolved',
          resolvedAt: new Date()
        });
      }
      return;
    }

    // If service is unhealthy and no existing incident, create one
    if (!existingIncident) {
      const severity = this.determineSeverity(health);
      const description = this.generateIncidentDescription(serviceId, health);
      
      await this.createIncident(serviceId, severity, description, {
        healthStatus: health.status,
        responseTime: health.responseTimeMs,
        errorRate: health.errorRate,
        consecutiveFailures: health.consecutiveFailures,
        issues: health.issues
      });
    } else {
      // Update existing incident with latest health data
      existingIncident.metadata = {
        ...existingIncident.metadata,
        healthStatus: health.status,
        responseTime: health.responseTimeMs,
        errorRate: health.errorRate,
        consecutiveFailures: health.consecutiveFailures,
        issues: health.issues,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Process incident through escalation rules and response actions
   */
  private async processIncident(incident: Incident): Promise<void> {
    // Apply escalation rules
    for (const rule of this.escalationRules) {
      if (await rule.condition(incident)) {
        await rule.action(incident);
        
        incident.timeline.push({
          timestamp: new Date(),
          action: 'escalated',
          description: `Escalation rule applied: ${rule.name}`,
          actor: 'system'
        });
      }
    }

    // Apply response actions
    for (const action of this.responseActions) {
      if (await action.condition(incident)) {
        try {
          await action.execute(incident);
          
          incident.timeline.push({
            timestamp: new Date(),
            action: 'response_action',
            description: `Response action executed: ${action.name}`,
            actor: 'system'
          });
        } catch (error) {
          this.logger.error(`Response action failed: ${action.name}`, error);
          
          incident.timeline.push({
            timestamp: new Date(),
            action: 'response_action_failed',
            description: `Response action failed: ${action.name} - ${error.message}`,
            actor: 'system'
          });
        }
      }
    }
  }

  /**
   * Resolve incident and perform cleanup
   */
  private async resolveIncident(incident: Incident): Promise<void> {
    incident.resolvedAt = new Date();
    incident.resolutionTime = incident.resolvedAt.getTime() - incident.createdAt.getTime();
    
    // Send resolution notification
    await this.sendNotification({
      type: 'incident_resolved',
      incident,
      message: `Incident ${incident.id} has been resolved`
    });

    this.logger.info(`Incident resolved: ${incident.id} (${incident.resolutionTime}ms)`);
  }

  /**
   * Determine incident severity based on health status
   */
  private determineSeverity(health: ServiceHealth): IncidentSeverity {
    if (health.status === 'down') {
      return health.consecutiveFailures >= 5 ? 'critical' : 'high';
    }
    if (health.status === 'degraded') {
      return health.errorRate > 0.5 ? 'high' : 'medium';
    }
    return 'low';
  }

  /**
   * Generate incident description
   */
  private generateIncidentDescription(serviceId: string, health: ServiceHealth): string {
    const service = this.registry.getService(serviceId);
    const serviceName = service?.name || serviceId;
    
    let description = `${serviceName} is ${health.status}`;
    
    if (health.responseTimeMs > 10000) {
      description += ` with high response time (${health.responseTimeMs}ms)`;
    }
    
    if (health.errorRate > 0.1) {
      description += ` and high error rate (${(health.errorRate * 100).toFixed(1)}%)`;
    }
    
    if (health.consecutiveFailures > 0) {
      description += ` after ${health.consecutiveFailures} consecutive failures`;
    }
    
    return description;
  }

  /**
   * Setup default escalation rules
   */
  private setupDefaultEscalationRules(): void {
    // Critical incidents - immediate escalation
    this.addEscalationRule({
      name: 'Critical Incident Immediate Escalation',
      condition: async (incident) => incident.severity === 'critical',
      action: async (incident) => {
        await this.sendNotification({
          type: 'critical_incident',
          incident,
          message: `CRITICAL: ${incident.description}`,
          urgency: 'high'
        });
      }
    });

    // High severity incidents - escalate after 5 minutes
    this.addEscalationRule({
      name: 'High Severity Escalation',
      condition: async (incident) => {
        return incident.severity === 'high' && 
               incident.status === 'open' &&
               (Date.now() - incident.createdAt.getTime()) > 300000; // 5 minutes
      },
      action: async (incident) => {
        await this.sendNotification({
          type: 'escalation',
          incident,
          message: `High severity incident unresolved for 5+ minutes: ${incident.description}`
        });
      }
    });

    // Any incident unresolved for 30 minutes
    this.addEscalationRule({
      name: 'Long Running Incident Escalation',
      condition: async (incident) => {
        return incident.status !== 'resolved' &&
               (Date.now() - incident.createdAt.getTime()) > 1800000; // 30 minutes
      },
      action: async (incident) => {
        await this.sendNotification({
          type: 'long_running_incident',
          incident,
          message: `Incident unresolved for 30+ minutes: ${incident.description}`
        });
      }
    });
  }

  /**
   * Setup default response actions
   */
  private setupDefaultResponseActions(): void {
    // Auto-restart monitoring for degraded services
    this.addResponseAction({
      name: 'Restart Service Monitoring',
      condition: async (incident) => {
        return incident.metadata?.healthStatus === 'degraded' &&
               incident.metadata?.consecutiveFailures >= 3;
      },
      execute: async (incident) => {
        await this.registry.healthMonitor.restartMonitoring(incident.serviceId);
        this.logger.info(`Restarted monitoring for service: ${incident.serviceId}`);
      }
    });

    // Log detailed health information for critical incidents
    this.addResponseAction({
      name: 'Log Critical Incident Details',
      condition: async (incident) => incident.severity === 'critical',
      execute: async (incident) => {
        const service = this.registry.getService(incident.serviceId);
        const health = await this.registry.getServiceHealth(incident.serviceId);
        
        this.logger.error('Critical incident details:', {
          incident: incident.id,
          service: service?.name,
          health,
          metadata: incident.metadata
        });
      }
    });
  }

  /**
   * Send notification
   */
  private async sendNotification(notification: Notification): Promise<void> {
    // Log notification
    this.logger.info(`Notification: ${notification.type} - ${notification.message}`);

    // Send to configured webhook if available
    if (this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(this.config.webhookHeaders || {})
          },
          body: JSON.stringify(notification)
        });
      } catch (error) {
        this.logger.error('Failed to send webhook notification:', error);
      }
    }

    // Send email if configured
    if (this.config.emailConfig && notification.urgency === 'high') {
      await this.sendEmailNotification(notification);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    // This would integrate with your email service
    // For now, just log the email that would be sent
    this.logger.info('Email notification would be sent:', {
      to: this.config.emailConfig?.recipients,
      subject: `TekUp Alert: ${notification.type}`,
      body: notification.message
    });
  }

  /**
   * Calculate average resolution time
   */
  private calculateAverageResolutionTime(incidents: Incident[]): number {
    const resolvedIncidents = incidents.filter(i => i.resolutionTime);
    if (resolvedIncidents.length === 0) return 0;
    
    const totalTime = resolvedIncidents.reduce((sum, i) => sum + (i.resolutionTime || 0), 0);
    return Math.round(totalTime / resolvedIncidents.length);
  }

  /**
   * Calculate Mean Time To Recovery (MTTR)
   */
  private calculateMTTR(incidents: Incident[]): number {
    const criticalIncidents = incidents.filter(i => 
      i.severity === 'critical' && i.resolutionTime
    );
    
    if (criticalIncidents.length === 0) return 0;
    
    const totalTime = criticalIncidents.reduce((sum, i) => sum + (i.resolutionTime || 0), 0);
    return Math.round(totalTime / criticalIncidents.length);
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INC-${timestamp}-${random}`.toUpperCase();
  }
}

// Types and interfaces
export interface Incident {
  id: string;
  serviceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolutionTime?: number; // milliseconds
  metadata: Record<string, any>;
  timeline: IncidentTimelineEntry[];
  assignee?: string;
  tags?: string[];
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  action: string;
  description: string;
  actor: string;
  changes?: any;
}

export interface EscalationRule {
  name: string;
  condition: (incident: Incident) => Promise<boolean>;
  action: (incident: Incident) => Promise<void>;
}

export interface ResponseAction {
  name: string;
  condition: (incident: Incident) => Promise<boolean>;
  execute: (incident: Incident) => Promise<void>;
}

export interface Notification {
  type: string;
  incident: Incident;
  message: string;
  urgency?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface IncidentFilters {
  serviceId?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  since?: Date;
  assignee?: string;
  tags?: string[];
}

export interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageResolutionTime: number;
  mttr: number;
}

export interface IncidentResponseConfig {
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
  emailConfig?: {
    recipients: string[];
    smtpConfig?: any;
  };
  escalationTimeouts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';