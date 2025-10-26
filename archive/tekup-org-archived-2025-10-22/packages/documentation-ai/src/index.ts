export { DocumentationAI } from './documentation-ai.js';
export { CodeAnalyzer } from './code-analyzer.js';
export { TranslationService } from './translation-service.js';
export { ChangeDetector } from './change-detector.js';
export { AnalyticsEngine } from './analytics-engine.js';
export { FeedbackSystem } from './feedback-system.js';
export * from './types.js';

// Re-export commonly used types
export type {
  AIConfig,
  Documentation,
  DocumentationUpdate,
  CodebaseSnapshot,
  TranslationRequest,
  TranslationResult,
  UsageAnalytics,
  ContentOptimization
} from './types.js';