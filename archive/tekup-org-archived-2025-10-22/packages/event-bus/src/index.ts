// Main exports
export { TekupEventBus } from './event-bus.js';
export { EventFactory, EventUtils, EventPatternBuilder } from './event-factory.js';

// Type exports
export type {
  BaseEvent,
  EventBusConfig,
  EventHandler,
  SubscriptionConfig,
  EventContext,
  TekupEvent,
  
  // Event types
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
  DashboardViewedEvent
} from './types.js';

// Enums
export { EventPriority, EventStatus } from './types.js';

// Constants
export { EVENT_TYPES } from './types.js';

// Utilities
export { createEventFilter, isEventType } from './types.js';

// Default configuration factory
export const createDefaultEventBusConfig = (
  redisUrl: string,
  serviceName: string,
  overrides?: Partial<EventBusConfig>
): EventBusConfig => ({
  redisUrl,
  serviceName,
  namespace: 'tekup',
  retryAttempts: 3,
  retryDelay: 1000,
  deadLetterTtl: 86400, // 24 hours
  batchSize: 10,
  concurrency: 5,
  ...overrides
});

// Quick start factory
export const createEventBus = async (
  redisUrl: string,
  serviceName: string,
  config?: Partial<EventBusConfig>
): Promise<TekupEventBus> => {
  const eventBus = new TekupEventBus(
    createDefaultEventBusConfig(redisUrl, serviceName, config)
  );
  
  await eventBus.initialize();
  return eventBus;
};

