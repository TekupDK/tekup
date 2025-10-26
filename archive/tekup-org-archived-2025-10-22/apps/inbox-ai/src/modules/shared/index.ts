/**
 * Shared Module for Security Platform
 * 
 * This module contains shared utilities, types, and services used across
 * all security scanner modules including tenant management, Microsoft Graph
 * service, and common data structures.
 */

export { MicrosoftGraphService } from './MicrosoftGraphService.js'
export { TenantService } from './TenantService.js'
export { AzureCredentialManager } from './AzureCredentialManager.js'
export { CronSchedulerService } from './CronSchedulerService.js'
export { InboxHubManager } from './InboxHubManager.js'

export type {
  Tenant,
  ScanResult,
  Finding,
  SecurityAlert,
  ComplianceStatus,
  AzureCredentials,
  ScanProgress,
  NotificationMessage
} from './types.js'