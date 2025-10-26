import { z } from 'zod';

// Base Event Interface
export interface BaseEvent {
  id: string;
  type: string;
  tenantId: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  version: string;
}

// Event Priority Levels
export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Event Processing Status
export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// Event Handler Configuration
export interface EventHandlerConfig {
  id: string;
  eventType: string;
  priority: EventPriority;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  deadLetterQueue?: string;
}

// Event Handler Function Type
export type EventHandler<T extends BaseEvent = BaseEvent> = (
  event: T,
  context?: EventContext
) => Promise<void>;

// Event Context for Handlers
export interface EventContext {
  attempt: number;
  maxAttempts: number;
  startTime: Date;
  correlationId?: string;
  parentEventId?: string;
}

// Event Bus Configuration
export interface EventBusConfig {
  redisUrl: string;
  serviceName: string;
  namespace?: string;
  retryAttempts: number;
  retryDelay: number;
  deadLetterTtl: number;
  batchSize: number;
  concurrency: number;
}

// Subscription Configuration
export interface SubscriptionConfig {
  eventType: string;
  handler: EventHandler;
  priority: EventPriority;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  filter?: (event: BaseEvent) => boolean;
}

// ==========================================
// AI APPLICATION EVENT TYPES
// ==========================================

// AI Proposal Engine Events
export interface ProposalCreatedEvent extends BaseEvent {
  type: 'proposal.created';
  data: {
    proposalId: string;
    clientName: string;
    estimatedValue: number;
    confidence: number;
    leadId?: string;
  };
}

export interface BuyingSignalDetectedEvent extends BaseEvent {
  type: 'buying-signal.detected';
  data: {
    proposalId: string;
    signalType: 'urgency' | 'budget' | 'authority' | 'pain_point';
    content: string;
    confidence: number;
    position: number;
  };
}

// AI Content Generation Events
export interface ContentGeneratedEvent extends BaseEvent {
  type: 'content.generated';
  data: {
    contentId: string;
    type: 'blog' | 'social' | 'email' | 'marketing';
    platform?: string;
    title: string;
    wordCount: number;
    seoScore?: number;
  };
}

export interface ContentPublishedEvent extends BaseEvent {
  type: 'content.published';
  data: {
    contentId: string;
    platform: string;
    publishedAt: Date;
    scheduledFor?: Date;
  };
}

// AI Customer Support Events
export interface SupportSessionStartedEvent extends BaseEvent {
  type: 'support.session.started';
  data: {
    sessionId: string;
    contactId?: string;
    channel: 'chat' | 'email' | 'phone';
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export interface SupportSessionResolvedEvent extends BaseEvent {
  type: 'support.session.resolved';
  data: {
    sessionId: string;
    resolutionTime: number;
    satisfaction?: number;
    escalated: boolean;
    category: string;
  };
}

// Enhanced CRM Events
export interface LeadCreatedEvent extends BaseEvent {
  type: 'lead.created';
  data: {
    leadId: string;
    source: string;
    score: number;
    contactId?: string;
    companyId?: string;
  };
}

export interface LeadScoredEvent extends BaseEvent {
  type: 'lead.scored';
  data: {
    leadId: string;
    previousScore: number;
    newScore: number;
    factors: Array<{
      factor: string;
      impact: number;
      confidence: number;
    }>;
  };
}

export interface LeadConvertedEvent extends BaseEvent {
  type: 'lead.converted';
  data: {
    leadId: string;
    dealId: string;
    conversionValue: number;
    conversionTime: number;
    touchpoints: string[];
  };
}

// Marketing Automation Events
export interface CampaignLaunchedEvent extends BaseEvent {
  type: 'campaign.launched';
  data: {
    campaignId: string;
    type: 'email' | 'sms' | 'social' | 'push';
    targetAudience: number;
    scheduledAt: Date;
    aiGenerated: boolean;
  };
}

export interface CampaignCompletedEvent extends BaseEvent {
  type: 'campaign.completed';
  data: {
    campaignId: string;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    roi: number;
  };
}

// Project Management Events
export interface ProjectCreatedEvent extends BaseEvent {
  type: 'project.created';
  data: {
    projectId: string;
    name: string;
    budget?: number;
    deadline?: Date;
    teamSize: number;
  };
}

export interface TaskCompletedEvent extends BaseEvent {
  type: 'task.completed';
  data: {
    taskId: string;
    projectId: string;
    assigneeId: string;
    completionTime: number;
    estimatedHours?: number;
    actualHours?: number;
  };
}

// AI Analytics Events
export interface PredictionGeneratedEvent extends BaseEvent {
  type: 'prediction.generated';
  data: {
    predictionId: string;
    modelId: string;
    type: 'lead_score' | 'churn_risk' | 'revenue_forecast';
    confidence: number;
    input: Record<string, any>;
    output: Record<string, any>;
  };
}

export interface ModelTrainedEvent extends BaseEvent {
  type: 'model.trained';
  data: {
    modelId: string;
    type: string;
    accuracy: number;
    trainingDuration: number;
    dataPoints: number;
    version: string;
  };
}

// Voice AI & Computer Vision Events
export interface VoiceTranscribedEvent extends BaseEvent {
  type: 'voice.transcribed';
  data: {
    recordingId: string;
    duration: number;
    language: string;
    confidence: number;
    speakers: number;
    keywords: string[];
  };
}

export interface ImageAnalyzedEvent extends BaseEvent {
  type: 'image.analyzed';
  data: {
    imageId: string;
    objects: Array<{
      name: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    faces: number;
    text?: string;
    sentiment?: string;
  };
}

// Business Intelligence Events
export interface ReportGeneratedEvent extends BaseEvent {
  type: 'report.generated';
  data: {
    reportId: string;
    type: 'sales' | 'marketing' | 'financial' | 'operational';
    period: string;
    metrics: Record<string, number>;
    insights: string[];
  };
}

export interface DashboardViewedEvent extends BaseEvent {
  type: 'dashboard.viewed';
  data: {
    dashboardId: string;
    viewDuration: number;
    interactionCount: number;
    widgets: string[];
  };
}

// Union type for all events
export type TekupEvent = 
  | ProposalCreatedEvent
  | BuyingSignalDetectedEvent
  | ContentGeneratedEvent
  | ContentPublishedEvent
  | SupportSessionStartedEvent
  | SupportSessionResolvedEvent
  | LeadCreatedEvent
  | LeadScoredEvent
  | LeadConvertedEvent
  | CampaignLaunchedEvent
  | CampaignCompletedEvent
  | ProjectCreatedEvent
  | TaskCompletedEvent
  | PredictionGeneratedEvent
  | ModelTrainedEvent
  | VoiceTranscribedEvent
  | ImageAnalyzedEvent
  | ReportGeneratedEvent
  | DashboardViewedEvent;

// Event Schema Validation
export const BaseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
  version: z.string().default('1.0.0')
});

// Event Type Registry
export const EVENT_TYPES = {
  // Proposal Engine
  PROPOSAL_CREATED: 'proposal.created',
  BUYING_SIGNAL_DETECTED: 'buying-signal.detected',
  
  // Content Generation
  CONTENT_GENERATED: 'content.generated',
  CONTENT_PUBLISHED: 'content.published',
  
  // Customer Support
  SUPPORT_SESSION_STARTED: 'support.session.started',
  SUPPORT_SESSION_RESOLVED: 'support.session.resolved',
  
  // CRM & Leads
  LEAD_CREATED: 'lead.created',
  LEAD_SCORED: 'lead.scored',
  LEAD_CONVERTED: 'lead.converted',
  
  // Marketing
  CAMPAIGN_LAUNCHED: 'campaign.launched',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  
  // Project Management
  PROJECT_CREATED: 'project.created',
  TASK_COMPLETED: 'task.completed',
  
  // Analytics & Predictions
  PREDICTION_GENERATED: 'prediction.generated',
  MODEL_TRAINED: 'model.trained',
  
  // Voice & Vision
  VOICE_TRANSCRIBED: 'voice.transcribed',
  IMAGE_ANALYZED: 'image.analyzed',
  
  // Business Intelligence
  REPORT_GENERATED: 'report.generated',
  DASHBOARD_VIEWED: 'dashboard.viewed'
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Event Pattern Matching
export const isEventType = <T extends TekupEvent>(
  event: BaseEvent,
  eventType: T['type']
): event is T => {
  return event.type === eventType;
};

// Event Filtering
export const createEventFilter = (
  patterns: string[]
): ((event: BaseEvent) => boolean) => {
  return (event: BaseEvent) => {
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(event.type);
      }
      return event.type === pattern;
    });
  };
};

