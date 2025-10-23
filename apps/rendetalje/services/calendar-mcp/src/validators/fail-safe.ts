/**
 * RenOS Calendar Intelligence MCP - Fail-Safe Mode
 * Confidence < 80% → Manual review required
 */

import config from '../config.js';
import { logger } from '../utils/logger.js';
import { BookingValidationResult, ValidationWarning } from '../types.js';

/**
 * Calculate confidence score for a booking validation
 */
export function calculateConfidence(result: {
  errors: unknown[];
  warnings: ValidationWarning[];
  hasCustomerHistory?: boolean;
  hasLearnedPattern?: boolean;
}): number {
  let confidence = 100;

  // Deduct for errors
  confidence -= result.errors.length * 30; // Each error = -30 points

  // Deduct for warnings by severity
  result.warnings.forEach(warning => {
    if (warning.severity === 'high') confidence -= 15;
    else if (warning.severity === 'medium') confidence -= 10;
    else confidence -= 5;
  });

  // Boost for customer history
  if (result.hasCustomerHistory) confidence += 10;
  
  // Boost for learned patterns
  if (result.hasLearnedPattern) confidence += 10;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Check if result requires manual review
 */
export function requiresManualReview(confidence: number): boolean {
  if (!config.features.failSafeMode) {
    return false; // Fail-safe disabled
  }

  const threshold = config.features.failSafeThreshold;
  return confidence < threshold;
}

/**
 * Apply fail-safe check to validation result
 */
export function applyFailSafe(
  result: Omit<BookingValidationResult, 'confidence' | 'requiresManualReview'>,
  metadata?: {
    hasCustomerHistory?: boolean;
    hasLearnedPattern?: boolean;
  }
): BookingValidationResult {
  const confidence = calculateConfidence({
    errors: result.errors,
    warnings: result.warnings,
    hasCustomerHistory: metadata?.hasCustomerHistory,
    hasLearnedPattern: metadata?.hasLearnedPattern,
  });

  const requiresReview = requiresManualReview(confidence);

  if (requiresReview) {
    logger.warn('Fail-safe triggered - manual review required', {
      confidence,
      threshold: config.features.failSafeThreshold,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
    });

    // Add warning about manual review
    result.warnings.push({
      type: 'pattern_violation',
      message: `Lav confidence (${confidence}%) - manuel gennemgang påkrævet!`,
      severity: 'high',
      data: {
        confidence,
        threshold: config.features.failSafeThreshold,
      },
    });
  }

  return {
    ...result,
    confidence,
    requiresManualReview: requiresReview,
  };
}

/**
 * Generate suggestion based on validation result
 */
export function generateSuggestion(result: BookingValidationResult): string | undefined {
  if (result.errors.length > 0) {
    const errorTypes = result.errors.map(e => e.type).join(', ');
    return `Ret følgende fejl før booking: ${errorTypes}`;
  }

  if (result.requiresManualReview) {
    return 'Denne booking ser usædvanlig ud. Gennemgå manuelt før godkendelse.';
  }

  if (result.warnings.some(w => w.severity === 'high')) {
    return 'Vær opmærksom på advarslerne før du fortsætter.';
  }

  if (result.confidence >= 90) {
    return 'Booking ser god ud! Alt OK.';
  }

  return undefined;
}

export default {
  calculateConfidence,
  requiresManualReview,
  applyFailSafe,
  generateSuggestion,
};

