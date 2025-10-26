import { v4 as uuidv4 } from 'uuid';
import {
  TekupEvent,
  ProposalCreatedEvent,
  BuyingSignalDetectedEvent,
  ContentGeneratedEvent,
  ContentPublishedEvent,
  SupportSessionStartedEvent,
  SupportSessionResolvedEvent,
  LeadCreatedEvent,
  LeadScoredEvent,
  LeadConvertedEvent,
  CampaignLaunchedEvent,
  CampaignCompletedEvent,
  ProjectCreatedEvent,
  TaskCompletedEvent,
  PredictionGeneratedEvent,
  ModelTrainedEvent,
  VoiceTranscribedEvent,
  ImageAnalyzedEvent,
  ReportGeneratedEvent,
  DashboardViewedEvent,
  EVENT_TYPES
} from './types.js';

/**
 * Factory class for creating strongly-typed events
 */
export class EventFactory {
  /**
   * Create a proposal created event
   */
  static proposalCreated(
    tenantId: string,
    userId: string,
    data: ProposalCreatedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ProposalCreatedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.PROPOSAL_CREATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a buying signal detected event
   */
  static buyingSignalDetected(
    tenantId: string,
    userId: string,
    data: BuyingSignalDetectedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<BuyingSignalDetectedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.BUYING_SIGNAL_DETECTED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a content generated event
   */
  static contentGenerated(
    tenantId: string,
    userId: string,
    data: ContentGeneratedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ContentGeneratedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.CONTENT_GENERATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a content published event
   */
  static contentPublished(
    tenantId: string,
    userId: string,
    data: ContentPublishedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ContentPublishedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.CONTENT_PUBLISHED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a support session started event
   */
  static supportSessionStarted(
    tenantId: string,
    userId: string,
    data: SupportSessionStartedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<SupportSessionStartedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.SUPPORT_SESSION_STARTED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a support session resolved event
   */
  static supportSessionResolved(
    tenantId: string,
    userId: string,
    data: SupportSessionResolvedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<SupportSessionResolvedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.SUPPORT_SESSION_RESOLVED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a lead created event
   */
  static leadCreated(
    tenantId: string,
    userId: string,
    data: LeadCreatedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<LeadCreatedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.LEAD_CREATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a lead scored event
   */
  static leadScored(
    tenantId: string,
    userId: string,
    data: LeadScoredEvent['data'],
    metadata?: Record<string, any>
  ): Omit<LeadScoredEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.LEAD_SCORED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a lead converted event
   */
  static leadConverted(
    tenantId: string,
    userId: string,
    data: LeadConvertedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<LeadConvertedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.LEAD_CONVERTED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a campaign launched event
   */
  static campaignLaunched(
    tenantId: string,
    userId: string,
    data: CampaignLaunchedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<CampaignLaunchedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.CAMPAIGN_LAUNCHED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a campaign completed event
   */
  static campaignCompleted(
    tenantId: string,
    userId: string,
    data: CampaignCompletedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<CampaignCompletedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.CAMPAIGN_COMPLETED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a project created event
   */
  static projectCreated(
    tenantId: string,
    userId: string,
    data: ProjectCreatedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ProjectCreatedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.PROJECT_CREATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a task completed event
   */
  static taskCompleted(
    tenantId: string,
    userId: string,
    data: TaskCompletedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<TaskCompletedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.TASK_COMPLETED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a prediction generated event
   */
  static predictionGenerated(
    tenantId: string,
    userId: string,
    data: PredictionGeneratedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<PredictionGeneratedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.PREDICTION_GENERATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a model trained event
   */
  static modelTrained(
    tenantId: string,
    userId: string,
    data: ModelTrainedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ModelTrainedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.MODEL_TRAINED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a voice transcribed event
   */
  static voiceTranscribed(
    tenantId: string,
    userId: string,
    data: VoiceTranscribedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<VoiceTranscribedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.VOICE_TRANSCRIBED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create an image analyzed event
   */
  static imageAnalyzed(
    tenantId: string,
    userId: string,
    data: ImageAnalyzedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ImageAnalyzedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.IMAGE_ANALYZED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a report generated event
   */
  static reportGenerated(
    tenantId: string,
    userId: string,
    data: ReportGeneratedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<ReportGeneratedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.REPORT_GENERATED,
      tenantId,
      userId,
      data,
      metadata
    };
  }

  /**
   * Create a dashboard viewed event
   */
  static dashboardViewed(
    tenantId: string,
    userId: string,
    data: DashboardViewedEvent['data'],
    metadata?: Record<string, any>
  ): Omit<DashboardViewedEvent, 'id' | 'timestamp' | 'version'> {
    return {
      type: EVENT_TYPES.DASHBOARD_VIEWED,
      tenantId,
      userId,
      data,
      metadata
    };
  }
}

/**
 * Event utilities for common operations
 */
export class EventUtils {
  /**
   * Create correlation metadata for event chains
   */
  static createCorrelationMetadata(
    parentEventId?: string,
    workflowId?: string,
    sessionId?: string
  ): Record<string, any> {
    return {
      correlationId: uuidv4(),
      parentEventId,
      workflowId,
      sessionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create event batch for publishing multiple related events
   */
  static createEventBatch<T extends TekupEvent>(
    events: Array<Omit<T, 'id' | 'timestamp' | 'version'>>,
    batchMetadata?: Record<string, any>
  ): Array<Omit<T, 'id' | 'timestamp' | 'version'>> {
    const batchId = uuidv4();
    const batchTimestamp = new Date().toISOString();

    return events.map((event, index) => ({
      ...event,
      metadata: {
        ...event.metadata,
        ...batchMetadata,
        batchId,
        batchSequence: index,
        batchSize: events.length,
        batchTimestamp
      }
    }));
  }

  /**
   * Extract tenant context from event
   */
  static extractTenantContext(event: TekupEvent): {
    tenantId: string;
    userId?: string;
  } {
    return {
      tenantId: event.tenantId,
      userId: event.userId
    };
  }

  /**
   * Check if event matches filters
   */
  static matchesFilters(
    event: TekupEvent,
    filters: {
      types?: string[];
      tenants?: string[];
      users?: string[];
      fromDate?: Date;
      toDate?: Date;
      metadata?: Record<string, any>;
    }
  ): boolean {
    if (filters.types && !filters.types.includes(event.type)) {
      return false;
    }

    if (filters.tenants && !filters.tenants.includes(event.tenantId)) {
      return false;
    }

    if (filters.users && event.userId && !filters.users.includes(event.userId)) {
      return false;
    }

    if (filters.fromDate && event.timestamp < filters.fromDate) {
      return false;
    }

    if (filters.toDate && event.timestamp > filters.toDate) {
      return false;
    }

    if (filters.metadata) {
      for (const [key, value] of Object.entries(filters.metadata)) {
        if (event.metadata?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Create event digest for summarization
   */
  static createEventDigest(events: TekupEvent[]): {
    totalEvents: number;
    eventTypes: Record<string, number>;
    tenants: Record<string, number>;
    timeRange: { start: Date; end: Date };
    summary: string;
  } {
    const eventTypes: Record<string, number> = {};
    const tenants: Record<string, number> = {};
    let earliestTimestamp = new Date();
    let latestTimestamp = new Date(0);

    events.forEach(event => {
      // Count event types
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
      
      // Count tenants
      tenants[event.tenantId] = (tenants[event.tenantId] || 0) + 1;
      
      // Track time range
      if (event.timestamp < earliestTimestamp) {
        earliestTimestamp = event.timestamp;
      }
      if (event.timestamp > latestTimestamp) {
        latestTimestamp = event.timestamp;
      }
    });

    // Generate summary
    const topEventType = Object.entries(eventTypes)
      .sort(([,a], [,b]) => b - a)[0];
    const topTenant = Object.entries(tenants)
      .sort(([,a], [,b]) => b - a)[0];

    const summary = `${events.length} events processed. ` +
      `Top event type: ${topEventType?.[0]} (${topEventType?.[1]} events). ` +
      `Most active tenant: ${topTenant?.[0]} (${topTenant?.[1]} events).`;

    return {
      totalEvents: events.length,
      eventTypes,
      tenants,
      timeRange: {
        start: earliestTimestamp,
        end: latestTimestamp
      },
      summary
    };
  }
}

/**
 * Event pattern builder for creating complex subscription patterns
 */
export class EventPatternBuilder {
  private patterns: string[] = [];

  /**
   * Add a specific event type
   */
  type(eventType: string): EventPatternBuilder {
    this.patterns.push(eventType);
    return this;
  }

  /**
   * Add all events from a service (e.g., "proposal.*")
   */
  service(serviceName: string): EventPatternBuilder {
    this.patterns.push(`${serviceName}.*`);
    return this;
  }

  /**
   * Add all events from a category (e.g., "*.created")
   */
  category(category: string): EventPatternBuilder {
    this.patterns.push(`*.${category}`);
    return this;
  }

  /**
   * Add custom wildcard pattern
   */
  pattern(pattern: string): EventPatternBuilder {
    this.patterns.push(pattern);
    return this;
  }

  /**
   * Build the final pattern array
   */
  build(): string[] {
    return [...this.patterns];
  }

  /**
   * Create a single pattern string for simple subscriptions
   */
  buildSingle(): string {
    if (this.patterns.length === 1) {
      return this.patterns[0];
    }
    throw new Error('Use build() for multiple patterns');
  }

  /**
   * Static method to create common patterns
   */
  static common = {
    allProposalEvents: () => new EventPatternBuilder().service('proposal').buildSingle(),
    allContentEvents: () => new EventPatternBuilder().service('content').buildSingle(),
    allSupportEvents: () => new EventPatternBuilder().service('support').buildSingle(),
    allLeadEvents: () => new EventPatternBuilder().service('lead').buildSingle(),
    allCampaignEvents: () => new EventPatternBuilder().service('campaign').buildSingle(),
    allProjectEvents: () => new EventPatternBuilder().service('project').buildSingle(),
    allCreatedEvents: () => new EventPatternBuilder().category('created').buildSingle(),
    allCompletedEvents: () => new EventPatternBuilder().category('completed').buildSingle(),
    allEvents: () => '*'
  };
}

