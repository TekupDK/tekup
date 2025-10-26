/**
 * Microsoft 365 Copilot Readiness Scanner Module
 * 
 * This module assesses Microsoft 365 environments for readiness to deploy
 * Microsoft 365 Copilot by analyzing SharePoint sites, Teams channels,
 * DLP policies, and sensitivity labels to identify potential security risks.
 */

export { CopilotReadinessScanner } from './CopilotReadinessScanner.js'
export { DLPPolicyChecker } from './DLPPolicyChecker.js'
export { OvershareDetector } from './OvershareDetector.js'
export { ReadinessCalculator } from './ReadinessCalculator.js'

export type {
  CopilotReadinessScanResult,
  CopilotScanData,
  CopilotFinding,
  SharePointSiteAnalysis,
  TeamsChannelAnalysis,
  DLPPolicyAnalysis,
  SensitivityLabelAnalysis,
  OvershareRisk
} from './types.js'