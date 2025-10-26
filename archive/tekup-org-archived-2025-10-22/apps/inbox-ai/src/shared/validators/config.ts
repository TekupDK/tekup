/**
 * Zod validation schemas for configuration types
 */

import { z } from 'zod'

export const OAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  refreshToken: z.string(),
  accessToken: z.string().optional(),
  expiresAt: z.date().optional(),
  scope: z.string(),
  provider: z.enum(['google', 'microsoft']),
})

export const TLSOptionsSchema = z.object({
  rejectUnauthorized: z.boolean().optional(),
  servername: z.string().optional(),
  ciphers: z.string().optional(),
  minVersion: z.string().optional(),
  maxVersion: z.string().optional(),
})

export const IMAPConfigSchema = z.object({
  id: z.string(),
  provider: z.enum([
    'gmail',
    'google-workspace',
    'outlook',
    'outlook365',
    'yahoo',
    'icloud',
    'fastmail',
    'protonmail',
    'generic'
  ]),
  displayName: z.string().min(1),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  authMethod: z.enum(['plain', 'oauth2', 'xoauth2']).optional(),
  oauth: OAuthConfigSchema.optional(),
  maxConnections: z.number().min(1).max(10).optional(),
  keepAlive: z.boolean().optional(),
  tlsOptions: TLSOptionsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastSyncAt: z.date().optional(),
  syncEnabled: z.boolean(),
  syncInterval: z.number().min(1).max(1440), // max 24 hours
})

export const SMTPConfigSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  authMethod: z.enum(['plain', 'oauth2']).optional(),
  oauth: OAuthConfigSchema.optional(),
  tlsOptions: TLSOptionsSchema.optional(),
})

export const AccountFeaturesSchema = z.object({
  supportsIdle: z.boolean(),
  supportsMove: z.boolean(),
  supportsQuota: z.boolean(),
  supportsSearch: z.boolean(),
  supportsSort: z.boolean(),
  supportsCondstore: z.boolean(),
  maxMessageSize: z.number().min(0),
})

export const EmailAccountSchema = z.object({
  id: z.string(),
  provider: z.enum([
    'gmail',
    'google-workspace',
    'outlook',
    'outlook365',
    'yahoo',
    'icloud',
    'fastmail',
    'protonmail',
    'generic'
  ]),
  displayName: z.string().min(1),
  emailAddress: z.string().email(),
  imap: IMAPConfigSchema,
  smtp: SMTPConfigSchema.optional(),
  folders: z.array(z.string()),
  quotaUsed: z.number().min(0).optional(),
  quotaLimit: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'error', 'authenticating', 'syncing', 'offline']),
  lastError: z.string().optional(),
  features: AccountFeaturesSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const RateLimitSchema = z.object({
  requestsPerMinute: z.number().min(0),
  tokensPerMinute: z.number().min(0),
  requestsPerDay: z.number().min(0),
  tokensPerDay: z.number().min(0),
})

export const AIFeaturesSchema = z.object({
  summarization: z.boolean(),
  composition: z.boolean(),
  categorization: z.boolean(),
  actionExtraction: z.boolean(),
  sentimentAnalysis: z.boolean(),
  translation: z.boolean(),
  smartReply: z.boolean(),
})

export const AIProviderSchema = z.object({
  id: z.string(),
  name: z.enum(['openai', 'anthropic', 'local', 'azure-openai', 'google-palm']),
  displayName: z.string().min(1),
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional(),
  model: z.string().min(1),
  models: z.array(z.string()),
  maxTokens: z.number().min(1).max(100000),
  temperature: z.number().min(0).max(2),
  enabled: z.boolean(),
  rateLimit: RateLimitSchema.optional(),
  features: AIFeaturesSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const AppSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  
  // Email settings
  defaultEmailAccount: z.string().optional(),
  markAsReadOnView: z.boolean(),
  showNotifications: z.boolean(),
  soundEnabled: z.boolean(),
  autoSync: z.boolean(),
  syncInterval: z.number().min(1).max(1440),
  
  // AI settings
  defaultAIProvider: z.string().optional(),
  autoSummarize: z.boolean(),
  autoCategorize: z.boolean(),
  autoExtractActions: z.boolean(),
  aiConfidence: z.number().min(0).max(1),
  
  // Privacy settings
  sendUsageData: z.boolean(),
  enableLocalAI: z.boolean(),
  dataRetentionDays: z.number().min(1).max(3650),
  
  // UI settings
  compactView: z.boolean(),
  showPreview: z.boolean(),
  threadsEnabled: z.boolean(),
  keyboardShortcuts: z.boolean(),
  
  // Performance settings
  emailsPerPage: z.number().min(10).max(500),
  preloadEmails: z.number().min(0).max(100),
  cacheSize: z.number().min(10).max(1000),
  
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const SyncStatusSchema = z.object({
  accountId: z.string(),
  status: z.enum(['idle', 'syncing', 'error', 'paused']),
  progress: z.number().min(0).max(100),
  currentFolder: z.string().optional(),
  lastSync: z.date().optional(),
  nextSync: z.date().optional(),
  error: z.string().optional(),
  emailsProcessed: z.number().min(0),
  emailsTotal: z.number().min(0),
})

export const NotificationConfigSchema = z.object({
  enabled: z.boolean(),
  types: z.array(z.enum([
    'new_email',
    'important_email',
    'sync_error',
    'account_error',
    'ai_error'
  ])),
  sound: z.boolean(),
  badge: z.boolean(),
  desktop: z.boolean(),
  emailPreview: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
})

export const BackupConfigSchema = z.object({
  enabled: z.boolean(),
  location: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  retention: z.number().min(1).max(365),
  includeAttachments: z.boolean(),
  encryption: z.boolean(),
  lastBackup: z.date().optional(),
  nextBackup: z.date().optional(),
})

export const SecurityConfigSchema = z.object({
  masterPassword: z.string().optional(),
  biometricAuth: z.boolean(),
  sessionTimeout: z.number().min(1).max(1440),
  encryptionKey: z.string().optional(),
  requireAuthForSettings: z.boolean(),
  requireAuthForAccounts: z.boolean(),
})

// Input validation helpers
export const CreateIMAPConfigSchema = IMAPConfigSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateIMAPConfigSchema = IMAPConfigSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).partial()

export const CreateAIProviderSchema = AIProviderSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateAIProviderSchema = AIProviderSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).partial()

export const UpdateAppSettingsSchema = AppSettingsSchema.omit({ 
  createdAt: true, 
  updatedAt: true 
}).partial()

// Type inference helpers
export type IMAPConfigInput = z.input<typeof CreateIMAPConfigSchema>
export type IMAPConfigUpdate = z.input<typeof UpdateIMAPConfigSchema>
export type AIProviderInput = z.input<typeof CreateAIProviderSchema>
export type AIProviderUpdate = z.input<typeof UpdateAIProviderSchema>
export type AppSettingsInput = z.input<typeof UpdateAppSettingsSchema>