/**
 * NIS2 Compliance Scanner Module
 * 
 * This module implements NIS2 baseline compliance scanning for Microsoft 365 environments.
 * It evaluates MFA coverage, Conditional Access policies, risky users, device compliance,
 * and backup strategies to provide a comprehensive NIS2 compliance score.
 */

export { NIS2Scanner } from './NIS2Scanner.js'
export { NIS2ComplianceEvaluator } from './NIS2ComplianceEvaluator.js'
export { NIS2Scorer } from './NIS2Scorer.js'

export type {
  NIS2ScanResult,
  NIS2ScanData,
  NIS2Finding,
  NIS2ScoringWeights,
  MFAStatusReport,
  ConditionalAccessPolicy,
  RiskyUser,
  DeviceComplianceReport
} from './types.js'