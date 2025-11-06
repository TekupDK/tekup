/**
 * Feature Rollout Management
 * Enables gradual rollout of features to percentage of users
 *
 * Strategy: 10% → 50% → 100%
 */

import crypto from "crypto";

export type FeatureFlag =
  | "ai_suggestions"
  | "action_execution"
  | "dry_run_mode"
  | "email_automation"
  | "invoice_creation";

/**
 * Rollout configuration for each feature
 */
interface RolloutConfig {
  percentage: number; // 0-100
  enabled: boolean;
  description: string;
}

/**
 * Current rollout status for all features
 * Adjust these percentages to control rollout
 */
const ROLLOUT_CONFIG: Record<FeatureFlag, RolloutConfig> = {
  ai_suggestions: {
    percentage: 100, // Fully rolled out
    enabled: true,
    description: "AI-powered action suggestions in chat",
  },
  action_execution: {
    percentage: 100, // Fully rolled out
    enabled: true,
    description: "Ability to execute suggested actions",
  },
  dry_run_mode: {
    percentage: 100, // Fully rolled out
    enabled: true,
    description: "Preview action effects before execution",
  },
  email_automation: {
    percentage: 50, // 50% rollout
    enabled: true,
    description: "Automated email handling (snooze, archive, mark done)",
  },
  invoice_creation: {
    percentage: 10, // 10% rollout (beta)
    enabled: true,
    description: "AI-assisted invoice creation via Billy.dk",
  },
};

/**
 * Determine if a user is in the rollout group for a feature
 * Uses consistent hashing so same user always gets same result
 */
export function isUserInRollout(userId: number, feature: FeatureFlag): boolean {
  const config = ROLLOUT_CONFIG[feature];

  // If feature disabled globally, no one gets it
  if (!config.enabled) {
    return false;
  }

  // If 100% rollout, everyone gets it
  if (config.percentage >= 100) {
    return true;
  }

  // If 0% rollout, no one gets it
  if (config.percentage <= 0) {
    return false;
  }

  // Hash user ID + feature name for consistent bucketing
  const hash = crypto
    .createHash("md5")
    .update(`${userId}-${feature}`)
    .digest("hex");

  // Convert first 8 hex chars to number between 0-100
  const bucket = parseInt(hash.substring(0, 8), 16) % 100;

  // User in rollout if their bucket is below percentage
  return bucket < config.percentage;
}

/**
 * Check if feature is available for user (rollout + feature flag)
 */
export function isFeatureAvailable(
  userId: number,
  feature: FeatureFlag
): boolean {
  const config = ROLLOUT_CONFIG[feature];

  if (!config.enabled) {
    return false;
  }

  return isUserInRollout(userId, feature);
}

/**
 * Get rollout status for all features for a user
 */
export function getUserFeatures(userId: number): Record<FeatureFlag, boolean> {
  const features: Record<string, boolean> = {};

  Object.keys(ROLLOUT_CONFIG).forEach(featureKey => {
    const feature = featureKey as FeatureFlag;
    features[feature] = isFeatureAvailable(userId, feature);
  });

  return features as Record<FeatureFlag, boolean>;
}

/**
 * Get rollout statistics (for admin dashboard)
 */
export function getRolloutStats(): Record<
  FeatureFlag,
  {
    percentage: number;
    enabled: boolean;
    description: string;
  }
> {
  return ROLLOUT_CONFIG;
}

/**
 * Update rollout percentage (admin only)
 * In production, this should be in database/admin panel
 */
export function updateRolloutPercentage(
  feature: FeatureFlag,
  percentage: number
): void {
  if (percentage < 0 || percentage > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }

  ROLLOUT_CONFIG[feature].percentage = percentage;
  console.log(`[ROLLOUT] Updated ${feature} to ${percentage}%`);
}

/**
 * Log rollout metrics (for monitoring)
 */
export function logRolloutMetric(
  userId: number,
  feature: FeatureFlag,
  action: "check" | "use" | "error"
): void {
  const config = ROLLOUT_CONFIG[feature];
  const inRollout = isUserInRollout(userId, feature);

  console.log(
    `[ROLLOUT_METRIC] user=${userId} feature=${feature} action=${action} inRollout=${inRollout} percentage=${config.percentage}%`
  );

  // TODO: Send to analytics service (e.g., Mixpanel, Amplitude)
}
