/**
 * Application constants for AI IMAP Inbox
 */

export const APP_CONFIG = {
  name: 'AI IMAP Inbox',
  version: '1.0.0',
  description: 'AI-powered IMAP email client with unified inbox and smart features',
  website: 'https://ai-imap-inbox.com',
  support: 'support@ai-imap-inbox.com',
} as const

export const DATABASE_CONFIG = {
  name: 'ai-imap-inbox.db',
  version: 1,
  migrationTable: 'migrations',
  backupInterval: 24 * 60 * 60 * 1000, // 24 hours
  vacuumInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSize: 1024 * 1024 * 1024, // 1GB
} as const

export const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
    authMethods: ['oauth2', 'plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: true,
      supportsSearch: true,
      supportsSort: true,
      supportsCondstore: true,
      maxMessageSize: 25 * 1024 * 1024, // 25MB
    },
  },
  'google-workspace': {
    name: 'Google Workspace',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
    authMethods: ['oauth2', 'plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: true,
      supportsSearch: true,
      supportsSort: true,
      supportsCondstore: true,
      maxMessageSize: 25 * 1024 * 1024, // 25MB
    },
  },
  outlook: {
    name: 'Outlook.com',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    authMethods: ['oauth2', 'plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: false,
      supportsSearch: true,
      supportsSort: true,
      supportsCondstore: false,
      maxMessageSize: 20 * 1024 * 1024, // 20MB
    },
  },
  outlook365: {
    name: 'Outlook 365',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
    authMethods: ['oauth2', 'plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: true,
      supportsSearch: true,
      supportsSort: true,
      supportsCondstore: true,
      maxMessageSize: 150 * 1024 * 1024, // 150MB
    },
  },
  yahoo: {
    name: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    authMethods: ['plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: false,
      supportsSearch: true,
      supportsSort: false,
      supportsCondstore: false,
      maxMessageSize: 25 * 1024 * 1024, // 25MB
    },
  },
  icloud: {
    name: 'iCloud Mail',
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: false },
    authMethods: ['plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: false,
      supportsSearch: true,
      supportsSort: false,
      supportsCondstore: false,
      maxMessageSize: 20 * 1024 * 1024, // 20MB
    },
  },
  fastmail: {
    name: 'Fastmail',
    imap: { host: 'imap.fastmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.fastmail.com', port: 587, secure: false },
    authMethods: ['plain'],
    features: {
      supportsIdle: true,
      supportsMove: true,
      supportsQuota: true,
      supportsSearch: true,
      supportsSort: true,
      supportsCondstore: true,
      maxMessageSize: 50 * 1024 * 1024, // 50MB
    },
  },
  protonmail: {
    name: 'ProtonMail',
    imap: { host: '127.0.0.1', port: 1143, secure: false }, // ProtonMail Bridge
    smtp: { host: '127.0.0.1', port: 1025, secure: false },
    authMethods: ['plain'],
    features: {
      supportsIdle: false,
      supportsMove: true,
      supportsQuota: false,
      supportsSearch: false,
      supportsSort: false,
      supportsCondstore: false,
      maxMessageSize: 25 * 1024 * 1024, // 25MB
    },
  },
  generic: {
    name: 'Generic IMAP',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 587, secure: false },
    authMethods: ['plain', 'oauth2'],
    features: {
      supportsIdle: false,
      supportsMove: true,
      supportsQuota: false,
      supportsSearch: true,
      supportsSort: false,
      supportsCondstore: false,
      maxMessageSize: 25 * 1024 * 1024, // 25MB
    },
  },
} as const

export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4-turbo',
    endpoint: 'https://api.openai.com/v1',
    maxTokens: 4096,
    features: {
      summarization: true,
      composition: true,
      categorization: true,
      actionExtraction: true,
      sentimentAnalysis: true,
      translation: true,
      smartReply: true,
      imageAnalysis: false,
      codeGeneration: true,
    },
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    defaultModel: 'claude-3-sonnet',
    endpoint: 'https://api.anthropic.com',
    maxTokens: 4096,
    features: {
      summarization: true,
      composition: true,
      categorization: true,
      actionExtraction: true,
      sentimentAnalysis: true,
      translation: true,
      smartReply: true,
      imageAnalysis: true,
      codeGeneration: true,
    },
  },
  'azure-openai': {
    name: 'Azure OpenAI',
    models: ['gpt-4', 'gpt-35-turbo'],
    defaultModel: 'gpt-4',
    endpoint: '', // User-configured
    maxTokens: 4096,
    features: {
      summarization: true,
      composition: true,
      categorization: true,
      actionExtraction: true,
      sentimentAnalysis: true,
      translation: true,
      smartReply: true,
      imageAnalysis: false,
      codeGeneration: true,
    },
  },
  'google-palm': {
    name: 'Google PaLM',
    models: ['text-bison', 'chat-bison'],
    defaultModel: 'text-bison',
    endpoint: 'https://generativelanguage.googleapis.com',
    maxTokens: 1024,
    features: {
      summarization: true,
      composition: true,
      categorization: true,
      actionExtraction: true,
      sentimentAnalysis: true,
      translation: true,
      smartReply: true,
      imageAnalysis: false,
      codeGeneration: false,
    },
  },
  local: {
    name: 'Local AI',
    models: ['llama2-7b', 'llama2-13b', 'codellama'],
    defaultModel: 'llama2-7b',
    endpoint: 'http://localhost:11434', // Ollama default
    maxTokens: 2048,
    features: {
      summarization: true,
      composition: true,
      categorization: true,
      actionExtraction: true,
      sentimentAnalysis: true,
      translation: false,
      smartReply: true,
      imageAnalysis: false,
      codeGeneration: true,
    },
  },
} as const

export const DEFAULT_SETTINGS = {
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  
  // Email settings
  markAsReadOnView: true,
  showNotifications: true,
  soundEnabled: true,
  autoSync: true,
  syncInterval: 5, // minutes
  
  // AI settings
  autoSummarize: false,
  autoCategorize: true,
  autoExtractActions: true,
  aiConfidence: 0.7,
  
  // Privacy settings
  sendUsageData: false,
  enableLocalAI: false,
  dataRetentionDays: 365,
  
  // UI settings
  compactView: false,
  showPreview: true,
  threadsEnabled: true,
  keyboardShortcuts: true,
  
  // Performance settings
  emailsPerPage: 50,
  preloadEmails: 10,
  cacheSize: 100, // MB
} as const

export const FOLDER_TYPES = {
  inbox: 'INBOX',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
  spam: 'Spam',
  archive: 'Archive',
  custom: 'Custom',
} as const

export const EMAIL_PRIORITIES = {
  HIGHEST: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  LOWEST: 5,
} as const

export const SYNC_INTERVALS = [
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
] as const

export const KEYBOARD_SHORTCUTS = {
  // Navigation
  'j': 'Next email',
  'k': 'Previous email',
  'u': 'Back to inbox',
  'g i': 'Go to inbox',
  'g s': 'Go to sent',
  'g d': 'Go to drafts',
  'g t': 'Go to trash',
  
  // Actions
  'r': 'Reply',
  'a': 'Reply all',
  'f': 'Forward',
  'c': 'Compose',
  'e': 'Archive',
  '#': 'Delete',
  'l': 'Label',
  'v': 'Move to',
  '*': 'Select all',
  
  // Marks
  'x': 'Select',
  's': 'Star',
  'i': 'Mark important',
  'I': 'Mark unimportant',
  'U': 'Mark unread',
  
  // Search
  '/': 'Search',
  'Escape': 'Clear search',
  
  // AI
  'Ctrl+Shift+S': 'Summarize',
  'Ctrl+Shift+C': 'Categorize',
  'Ctrl+Shift+A': 'Extract actions',
  'Ctrl+Shift+R': 'Smart reply',
} as const

export const ERROR_CODES = {
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  
  // IMAP errors
  IMAP_LOGIN_FAILED: 'IMAP_LOGIN_FAILED',
  IMAP_FOLDER_NOT_FOUND: 'IMAP_FOLDER_NOT_FOUND',
  IMAP_MESSAGE_NOT_FOUND: 'IMAP_MESSAGE_NOT_FOUND',
  IMAP_OPERATION_FAILED: 'IMAP_OPERATION_FAILED',
  
  // AI errors
  AI_API_ERROR: 'AI_API_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_MODEL_NOT_FOUND: 'AI_MODEL_NOT_FOUND',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_MIGRATION_FAILED: 'DB_MIGRATION_FAILED',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  OPERATION_CANCELLED: 'OPERATION_CANCELLED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const