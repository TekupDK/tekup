/**
 * Configuration and account management types for AI IMAP Inbox
 */

export interface IMAPConfig {
  id: string
  provider: EmailProvider
  displayName: string
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  authMethod?: 'plain' | 'oauth2' | 'xoauth2'
  oauth?: OAuthConfig
  maxConnections?: number
  keepAlive?: boolean
  tlsOptions?: TLSOptions
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
  syncEnabled: boolean
  syncInterval: number // minutes
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken?: string
  expiresAt?: Date
  scope: string
  provider: 'google' | 'microsoft'
}

export interface TLSOptions {
  rejectUnauthorized?: boolean
  servername?: string
  ciphers?: string
  minVersion?: string
  maxVersion?: string
}

export interface SMTPConfig {
  id: string
  accountId: string
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  authMethod?: 'plain' | 'oauth2'
  oauth?: OAuthConfig
  tlsOptions?: TLSOptions
}

export type EmailProvider = 
  | 'gmail'
  | 'google-workspace'
  | 'outlook'
  | 'outlook365'
  | 'yahoo'
  | 'icloud'
  | 'fastmail'
  | 'protonmail'
  | 'generic'

export interface EmailAccount {
  id: string
  provider: EmailProvider
  displayName: string
  emailAddress: string
  imap: IMAPConfig
  smtp?: SMTPConfig
  folders: string[]
  quotaUsed?: number
  quotaLimit?: number
  status: AccountStatus
  lastError?: string
  features: AccountFeatures
  createdAt: Date
  updatedAt: Date
}

export type AccountStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'authenticating'
  | 'syncing'
  | 'offline'

export interface AccountFeatures {
  supportsIdle: boolean
  supportsMove: boolean
  supportsQuota: boolean
  supportsSearch: boolean
  supportsSort: boolean
  supportsCondstore: boolean
  maxMessageSize: number
}

export interface AIProvider {
  id: string
  name: 'openai' | 'anthropic' | 'local' | 'azure-openai' | 'google-palm'
  displayName: string
  type: string
  apiKey?: string
  endpoint?: string
  model: string
  models: string[]
  maxTokens: number
  temperature: number
  enabled: boolean
  isDefault: boolean
  rateLimit?: RateLimit
  features: AIFeatures
  createdAt: Date
  updatedAt: Date
}

export interface RateLimit {
  requestsPerMinute: number
  tokensPerMinute: number
  requestsPerDay: number
  tokensPerDay: number
  windowMs?: number
  maxRequests?: number
}

export interface AIFeatures {
  summarization: boolean
  composition: boolean
  categorization: boolean
  actionExtraction: boolean
  sentimentAnalysis: boolean
  translation: boolean
  smartReply: boolean
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  
  // Email settings
  defaultEmailAccount?: string
  markAsReadOnView: boolean
  showNotifications: boolean
  soundEnabled: boolean
  autoSync: boolean
  syncInterval: number // minutes
  
  // AI settings
  defaultAIProvider?: string
  autoSummarize: boolean
  autoCategorize: boolean
  autoExtractActions: boolean
  aiConfidence: number // 0-1
  
  // Privacy settings
  sendUsageData: boolean
  enableLocalAI: boolean
  dataRetentionDays: number
  
  // UI settings
  compactView: boolean
  showPreview: boolean
  threadsEnabled: boolean
  keyboardShortcuts: boolean
  
  // Performance settings
  emailsPerPage: number
  preloadEmails: number
  cacheSize: number // MB
  
  // Flow Ingestion Integration (TekUp Flow platform)
  flowIngestion?: {
    apiUrl: string
    tenantMappings: Record<string, string>
    retryAttempts: number
    timeoutMs: number
    enabled: boolean
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface SyncStatus {
  accountId: string
  status: 'idle' | 'syncing' | 'error' | 'paused'
  progress: number // 0-100
  currentFolder?: string
  lastSync?: Date
  nextSync?: Date
  error?: string
  emailsProcessed: number
  emailsTotal: number
}

export interface NotificationConfig {
  enabled: boolean
  types: NotificationType[]
  sound: boolean
  badge: boolean
  desktop: boolean
  emailPreview: boolean
  quietHours?: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
}

export type NotificationType = 
  | 'new_email'
  | 'important_email'
  | 'sync_error'
  | 'account_error'
  | 'ai_error'

export interface BackupConfig {
  enabled: boolean
  location: string
  frequency: 'daily' | 'weekly' | 'monthly'
  retention: number // days
  includeAttachments: boolean
  encryption: boolean
  lastBackup?: Date
  nextBackup?: Date
}

export interface SecurityConfig {
  masterPassword?: string
  biometricAuth: boolean
  sessionTimeout: number // minutes
  encryptionKey?: string
  requireAuthForSettings: boolean
  requireAuthForAccounts: boolean
}