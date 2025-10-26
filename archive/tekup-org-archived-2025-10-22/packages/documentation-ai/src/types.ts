export interface DocumentationUpdate {
  type: 'api-change' | 'component-update' | 'architecture-change' | 'content-optimization';
  files: string[];
  suggestedChanges: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string;
}

export interface CodebaseSnapshot {
  files: CodeFile[];
  dependencies: string[];
  architecture: ArchitectureInfo;
  timestamp: Date;
}

export interface CodeFile {
  path: string;
  content: string;
  type: 'typescript' | 'javascript' | 'markdown' | 'json' | 'yaml' | 'other';
  lastModified: Date;
  size: number;
}

export interface ArchitectureInfo {
  applications: ApplicationInfo[];
  packages: PackageInfo[];
  integrations: IntegrationInfo[];
}

export interface ApplicationInfo {
  name: string;
  type: 'api' | 'web' | 'mobile' | 'desktop';
  framework: string;
  path: string;
  dependencies: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
  exports: string[];
}

export interface IntegrationInfo {
  source: string;
  target: string;
  type: 'api' | 'websocket' | 'event' | 'database';
  description: string;
}

export interface Documentation {
  id: string;
  title: string;
  content: string;
  type: 'api' | 'guide' | 'whitepaper' | 'component' | 'architecture';
  language: 'en' | 'da';
  version: string;
  lastUpdated: Date;
  metadata: DocumentationMetadata;
}

export interface DocumentationMetadata {
  author: string;
  tags: string[];
  relatedDocs: string[];
  targetAudience: 'developer' | 'business' | 'admin' | 'all';
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

export interface UsageAnalytics {
  documentId: string;
  views: number;
  timeSpent: number;
  searchQueries: string[];
  userFeedback: UserFeedback[];
  popularSections: string[];
}

export interface UserFeedback {
  rating: number;
  comment: string;
  timestamp: Date;
  userId?: string;
  helpful: boolean;
}

export interface TranslationRequest {
  content: string;
  sourceLanguage: 'en' | 'da';
  targetLanguage: 'en' | 'da';
  context: string;
  preserveMarkdown: boolean;
}

export interface TranslationResult {
  translatedContent: string;
  confidence: number;
  warnings: string[];
  metadata: {
    model: string;
    timestamp: Date;
    tokensUsed: number;
  };
}

export interface AIConfig {
  openai?: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  gemini?: {
    apiKey: string;
    model: string;
  };
  defaultProvider: 'openai' | 'gemini';
  translationProvider: 'openai' | 'gemini';
}

export interface ContentOptimization {
  documentId: string;
  suggestions: OptimizationSuggestion[];
  analytics: UsageAnalytics;
  priority: 'low' | 'medium' | 'high';
}

export interface OptimizationSuggestion {
  type: 'structure' | 'content' | 'examples' | 'clarity' | 'completeness';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  suggestedChange: string;
}

export interface ChangeDetectionConfig {
  watchPaths: string[];
  ignorePaths: string[];
  documentationPaths: string[];
  autoSync: boolean;
  validationEnabled: boolean;
  rollbackEnabled: boolean;
  webhookUrl?: string;
  notificationChannels: string[];
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  affectedFiles: string[];
  rollbackRequired: boolean;
}

export interface RollbackInfo {
  id: string;
  timestamp: Date;
  changes: GitChange[];
  documentationUpdates: DocumentationUpdate[];
  reason: string;
}

export interface GitChange {
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  file: string;
  oldFile?: string;
  diff: string;
  timestamp: Date;
}

export interface AnalyticsConfig {
  trackingEnabled: boolean;
  anonymizeUsers: boolean;
  retentionDays: number;
  optimizationThreshold: number;
  feedbackEnabled: boolean;
  personalizationEnabled: boolean;
  storageType: 'file' | 'database' | 'memory';
  storagePath?: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  userAgent: string;
  referrer?: string;
  interactions: ContentInteraction[];
}

export interface ContentInteraction {
  documentId: string;
  action: 'view' | 'search' | 'feedback' | 'bookmark' | 'share' | 'copy';
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  results: number;
  clickedResults: string[];
}

export interface PersonalizationProfile {
  userId: string;
  role: 'developer' | 'business' | 'admin' | 'unknown';
  interests: string[];
  preferredLanguage: 'en' | 'da';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  frequentTopics: string[];
  lastActive: Date;
}

export interface FeedbackConfig {
  enabled: boolean;
  anonymousAllowed: boolean;
  moderationEnabled: boolean;
  autoResponseEnabled: boolean;
  improvementThreshold: number;
  storagePath?: string;
}

export interface FeedbackSuggestion {
  id: string;
  documentId: string;
  type: 'content' | 'structure' | 'examples' | 'clarity' | 'accuracy';
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  votes: number;
}

export interface ImprovementRequest {
  id: string;
  documentId: string;
  title: string;
  description: string;
  category: 'missing-info' | 'outdated' | 'error' | 'enhancement' | 'translation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy?: string;
  timestamp: Date;
  status: 'open' | 'in-progress' | 'completed' | 'closed';
  assignedTo?: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface FeedbackAnalysis {
  documentId: string;
  overallRating: number;
  totalFeedback: number;
  sentimentScore: number;
  commonIssues: Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  improvementSuggestions: string[];
  userSatisfaction: 'low' | 'medium' | 'high';
}