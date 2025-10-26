/**
 * M365 Backup & Security Monitoring Module
 * 
 * This module monitors Microsoft 365 backup status through Veeam API integration,
 * validates Microsoft Defender for Business configurations, and performs
 * automated restore testing to ensure backup integrity.
 */

export { BackupMonitor } from './BackupMonitor.js'
export { VeeamAPIService } from './VeeamAPIService.js'
export { DefenderValidator } from './DefenderValidator.js'
export { RestoreTester } from './RestoreTester.js'
export { M365BaselineChecker } from './M365BaselineChecker.js'

export type {
  BackupMonitorResult,
  BackupJob,
  BackupStatus,
  RestoreTestResult,
  DefenderConfiguration,
  M365BaselineStatus,
  BackupFinding
} from './types.js'