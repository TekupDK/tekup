/**
 * Shared Types for TekUp Secure Platform
 * 
 * Common data structures used across all security modules
 */

// Tenant Management
export interface Tenant {
  id: string
  name: string
  domain: string
  azureTenantId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  
  // Microsoft Graph credentials
  graphCredentials?: AzureCredentials
  
  // Veeam backup credentials
  veeamCredentials?: VeeamCredentials
}

export interface AzureCredentials {
  tenantId: string
  clientId: string
  clientSecret: string
  scope?: string
}

export interface VeeamCredentials {
  serverUrl: string
  apiKey: string
  organizationId?: string
}

// Scan Results
export interface ScanResult {
  id: string
  tenantId: string
  scanType: 'nis2' | 'copilot' | 'backup'
  score: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  findings: Finding[]
  metadata: ScanMetadata
  scanStarted: Date
  scanCompleted?: Date
  reportPath?: string
}

export interface Finding {
  id: string
  scanResultId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  title: string
  description: string
  recommendation: string
  hasQuickFix: boolean
  isResolved: boolean
  foundAt: Date
  resolvedAt?: Date
  affectedResource?: string
  riskScore: number
}

export interface ScanMetadata {
  version: string
  scanDuration: number
  resourcesScanned: number
  rulesEvaluated: number
  additionalData?: Record<string, any>
}

// Security Alerts & Notifications
export interface SecurityAlert {
  id: string
  tenantId: string
  type: 'compliance' | 'security' | 'backup' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  source: string
  isRead: boolean
  isResolved: boolean
  createdAt: Date
  resolvedAt?: Date
  actionRequired: boolean
  relatedFindingId?: string
}

export interface NotificationMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  actionLabel?: string
}

// Compliance Status
export interface ComplianceStatus {
  tenantId: string
  overallScore: number
  nis2Score: number
  copilotReadiness: number
  backupStatus: number
  lastUpdated: Date
  trend: 'improving' | 'declining' | 'stable'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

// Scan Progress
export interface ScanProgress {
  scanId: string
  tenantId: string
  scanType: 'nis2' | 'copilot' | 'backup'
  stage: string
  progress: number // 0-100
  currentTask: string
  estimatedTimeRemaining?: number
  startedAt: Date
  status: 'initializing' | 'scanning' | 'analyzing' | 'completing' | 'completed' | 'failed'
  error?: string
}

// Microsoft Graph Types
export interface GraphServiceConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  scope: string
}

export interface MFAStatusReport {
  totalUsers: number
  mfaEnabledUsers: number
  mfaDisabledUsers: number
  coverage: number // percentage
  methodsBreakdown: {
    authenticatorApp: number
    sms: number
    call: number
    email: number
    fido2: number
  }
  lastUpdated: Date
}

export interface ConditionalAccessPolicy {
  id: string
  displayName: string
  state: 'enabled' | 'disabled' | 'enabledForReportingButNotEnforced'
  conditions: {
    applications: string[]
    users: string[]
    locations?: string[]
    platforms?: string[]
    riskLevels?: string[]
  }
  grantControls: {
    operator: 'AND' | 'OR'
    builtInControls: string[]
    customAuthenticationFactors?: string[]
  }
  createdDateTime: Date
  modifiedDateTime: Date
}

export interface RiskyUser {
  id: string
  userPrincipalName: string
  displayName: string
  riskLevel: 'low' | 'medium' | 'high'
  riskState: 'atRisk' | 'confirmedCompromised' | 'remediated' | 'dismissed'
  riskDetections: RiskDetection[]
  lastUpdated: Date
}

export interface RiskDetection {
  id: string
  detectionTimingType: 'realtime' | 'offline'
  riskType: string
  riskLevel: 'low' | 'medium' | 'high'
  location?: {
    city: string
    state: string
    country: string
  }
  ipAddress?: string
  detectedDateTime: Date
}

// Database Schema Types
export interface DatabaseConfig {
  path: string
  backupPath?: string
  encryptionKey?: string
}

export interface TenantDBRecord {
  id: string
  name: string
  domain: string
  azure_tenant_id: string
  graph_credentials: string // JSON encrypted
  veeam_credentials?: string // JSON encrypted
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScanResultDBRecord {
  id: string
  tenant_id: string
  scan_type: string
  score: number
  status: string
  findings: string // JSON
  metadata: string // JSON
  scan_started: string
  scan_completed?: string
  report_path?: string
}

// Error Types
export interface SecurityPlatformError extends Error {
  code: string
  tenantId?: string
  scanId?: string
  details?: Record<string, any>
}

// Email and AI Types
export interface EmailAccount {
  id: string
  email: string
  name: string
  imapHost: string
  imapPort: number
  password: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Email {
  id: string
  accountId: string
  messageId: string
  subject: string
  fromAddress: string
  toAddress: string
  body: EmailBody | string
  receivedAt: Date
  isRead: boolean
  folder: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
}

export interface EmailBody {
  text?: string
  html?: string
  match?: (pattern: RegExp) => RegExpMatchArray | null
  substring?: (start: number, end?: number) => string
}

export interface EmailAttachment {
  id: string
  filename: string
  contentType: string
  size: number
  data: Buffer
}

export interface LeadSource {
  name: string
  domain: string
  fromPattern: RegExp
  subjectPattern?: RegExp
  bodyPatterns: RegExp[]
  fieldMappings: Record<string, string>
}

export interface Lead {
  id: string
  source: string
  email: string
  contactPerson?: string
  phone?: string
  company?: string
  serviceInterest?: string
  location?: string
  budgetRange?: string
  notes?: string
  priority?: number
  extractedData: Record<string, any>
  confidence: number
  createdAt: Date
  tenantKey?: string
}

export interface AIProcessingResult {
  summary: string
  category: string
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  suggestedActions: string[]
  extractedData?: Record<string, any>
}

export interface AIProvider {
  id: string
  name: string
  displayName: string
  type: string
  apiKey: string
  endpoint?: string
  model?: string
  models?: string[]
  maxTokens?: number
  temperature?: number
  enabled: boolean
  isDefault: boolean
  rateLimit?: {
    requests: number
    window: number
  }
  features?: string[]
  createdAt: Date
  updatedAt: Date
}

// Legacy Project X types removed - use FlowIngestion types instead

// Flow Ingestion (new canonical naming replacing Project X)
export interface FlowIngestionConfig {
  apiUrl: string
  tenantMappings: Record<string, string>
  retryAttempts: number
  timeoutMs: number
  enabled: boolean
}

export interface FlowIngestionLead {
  source: string
  payload: Record<string, any>
  metadata: {
    confidence?: number
    timestamp: string
    emailId?: string
    scanId?: string
    tenantId?: string
  }
}

export interface FlowIngestionComplianceLead {
  type: 'nis2_finding' | 'copilot_risk' | 'backup_failure' | 'security_alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation?: string
  affectedSystems?: string[]
  metadata: {
    scanId?: string
    timestamp: string
    tenantId?: string
    riskScore?: number
  }
  companyName: string
  contactEmail: string
  contactPhone?: string
}

export interface FlowIngestionApiResponse {
  success: boolean
  leadId?: string
  message?: string
  errors?: string[]
}

export interface SecurityAlert {
  id: string
  type: 'nis2_compliance' | 'copilot_risk' | 'backup_failure' | 'security_alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation?: string
  affectedSystems?: string[]
  scanId?: string
  detectedAt: Date
  riskScore?: number
}

export interface ComplianceStatus {
  compliant: boolean
  score: number
  findings: SecurityAlert[]
  lastAssessment: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: Date
}