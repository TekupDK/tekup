/**
 * Database and service types for AI IMAP Inbox
 */

import { Email, EmailThread, EmailFolder, EmailAction, SearchQuery, SearchResult } from './email'
import { EmailAccount, IMAPConfig, AIProvider, AppSettings, SyncStatus } from './config'
import { AIRequest, AICache, AIUsage, AIBatch } from './ai'

export interface DatabaseConfig {
  path: string
  version: number
  encrypted: boolean
  backupEnabled: boolean
  vacuumInterval: number // days
  walMode: boolean
  cacheSize: number // MB
  timeout: number // ms
}

export interface Migration {
  version: number
  name: string
  sql: string
  rollback?: string
  executedAt?: Date
}

export interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>
  findAll(options?: FindOptions): Promise<T[]>
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: K, updates: Partial<T>): Promise<T>
  delete(id: K): Promise<boolean>
  count(conditions?: Record<string, any>): Promise<number>
}

export interface FindOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  where?: Record<string, any>
}

export interface EmailRepository extends Repository<Email> {
  findByAccount(accountId: string, options?: FindOptions): Promise<Email[]>
  findByFolder(accountId: string, folder: string, options?: FindOptions): Promise<Email[]>
  findByThread(threadId: string): Promise<Email[]>
  search(query: SearchQuery): Promise<SearchResult>
  markAsRead(emailIds: string[]): Promise<void>
  markAsUnread(emailIds: string[]): Promise<void>
  moveToFolder(emailIds: string[], folder: string): Promise<void>
  deleteEmails(emailIds: string[]): Promise<void>
  bulkInsert(emails: Email[]): Promise<void>
  getUnreadCount(accountId: string, folder?: string): Promise<number>
  findDuplicates(accountId: string): Promise<string[]>
  cleanup(olderThan: Date): Promise<number>
}

export interface FolderRepository extends Repository<EmailFolder> {
  findByAccount(accountId: string): Promise<EmailFolder[]>
  findByPath(accountId: string, path: string): Promise<EmailFolder | null>
  updateCounts(accountId: string, folder: string): Promise<void>
  syncFolders(accountId: string, serverFolders: Partial<EmailFolder>[]): Promise<void>
}

export interface AccountRepository extends Repository<EmailAccount> {
  findByEmail(email: string): Promise<EmailAccount | null>
  findActive(): Promise<EmailAccount[]>
  updateStatus(accountId: string, status: string, error?: string): Promise<void>
  updateLastSync(accountId: string, timestamp: Date): Promise<void>
}

export interface AIRepository {
  requests: Repository<AIRequest>
  cache: Repository<AICache>
  usage: Repository<AIUsage>
  batches: Repository<AIBatch>
  
  getCachedResult(emailId: string, requestType: string, requestHash: string): Promise<any | null>
  cacheResult(emailId: string, requestType: string, requestHash: string, result: any, expiresIn: number): Promise<void>
  cleanupExpiredCache(): Promise<number>
  getUsageStats(dateRange?: { start: Date; end: Date }): Promise<any>
}

export interface ConfigRepository {
  getAppSettings(): Promise<AppSettings>
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>
  getAIProviders(): Promise<AIProvider[]>
  saveAIProvider(provider: AIProvider): Promise<AIProvider>
  deleteAIProvider(id: string): Promise<boolean>
  getSecureValue(key: string): Promise<string | null>
  setSecureValue(key: string, value: string): Promise<void>
  deleteSecureValue(key: string): Promise<boolean>
}

export interface EmailService {
  addAccount(config: IMAPConfig): Promise<EmailAccount>
  removeAccount(accountId: string): Promise<void>
  updateAccount(accountId: string, updates: Partial<EmailAccount>): Promise<EmailAccount>
  getAccounts(): Promise<EmailAccount[]>
  getAccount(accountId: string): Promise<EmailAccount | null>
  
  syncEmails(accountId: string, folder?: string): Promise<void>
  stopSync(accountId: string): Promise<void>
  
  getFolders(accountId: string): Promise<EmailFolder[]>
  createFolder(accountId: string, name: string, parent?: string): Promise<EmailFolder>
  deleteFolder(accountId: string, folderId: string): Promise<void>
  
  getEmails(accountId: string, folder: string, options?: FindOptions): Promise<Email[]>
  getEmail(emailId: string): Promise<Email | null>
  searchEmails(query: SearchQuery): Promise<SearchResult>
  
  performAction(action: EmailAction): Promise<void>
  sendEmail(composition: any): Promise<void>
  saveDraft(composition: any): Promise<string>
  
  getUnreadCount(accountId?: string): Promise<number>
  getSyncStatus(accountId: string): Promise<SyncStatus>
  
  // Event emitters
  onEmailReceived(callback: (email: Email) => void): void
  onSyncStatusChanged(callback: (status: SyncStatus) => void): void
  onError(callback: (error: Error, accountId: string) => void): void
}

export interface ConfigurationService {
  getAppSettings(): Promise<AppSettings>
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>
  resetAppSettings(): Promise<AppSettings>
  
  getAIProviders(): Promise<AIProvider[]>
  getAIProvider(id: string): Promise<AIProvider | null>
  saveAIProvider(provider: AIProvider): Promise<AIProvider>
  deleteAIProvider(id: string): Promise<boolean>
  
  importSettings(data: any): Promise<void>
  exportSettings(): Promise<any>
  
  // Secure storage
  storeCredentials(key: string, credentials: any): Promise<void>
  getCredentials(key: string): Promise<any | null>
  deleteCredentials(key: string): Promise<boolean>
  
  // Validation
  validateIMAPConfig(config: IMAPConfig): Promise<boolean>
  validateAIProvider(provider: AIProvider): Promise<boolean>
}

export interface NotificationService {
  showNotification(title: string, body: string, options?: any): Promise<void>
  showEmailNotification(email: Email): Promise<void>
  showSyncNotification(status: SyncStatus): Promise<void>
  showErrorNotification(error: Error): Promise<void>
  
  requestPermission(): Promise<boolean>
  hasPermission(): Promise<boolean>
  
  setBadgeCount(count: number): Promise<void>
  clearBadge(): Promise<void>
}

export interface LogService {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, error?: Error, meta?: any): void
  
  getLogs(level?: string, limit?: number): Promise<any[]>
  clearLogs(olderThan?: Date): Promise<number>
  
  exportLogs(): Promise<string>
}

export interface ServiceContainer {
  email: EmailService
  config: ConfigurationService
  notification: NotificationService
  log: LogService
  database: any // Database connection
}

export interface AppError extends Error {
  code: string
  type: 'validation' | 'network' | 'auth' | 'database' | 'ai' | 'unknown'
  accountId?: string
  details?: any
  timestamp: Date
  userMessage?: string
}

export interface EventBus {
  emit(event: string, data?: any): void
  on(event: string, callback: (data?: any) => void): void
  off(event: string, callback: (data?: any) => void): void
  once(event: string, callback: (data?: any) => void): void
}

export type AppEvent = 
  | 'email:received'
  | 'email:read'
  | 'email:deleted'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:error'
  | 'account:added'
  | 'account:removed'
  | 'account:error'
  | 'ai:completed'
  | 'ai:error'
  | 'settings:updated'
  | 'notification:shown'
  | 'error:occurred'