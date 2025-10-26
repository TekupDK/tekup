import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { AIServiceCategory, AIServicePermission } from '../types/auth.types.js';
import { AIAuthGuard } from './ai-auth.guard.js';

/**
 * Decorator to require specific AI service permission
 */
export const RequireAIPermission = (
  service: AIServiceCategory,
  permission: AIServicePermission,
  options?: {
    checkQuota?: boolean;
    description?: string;
  }
) => {
  const decorators = [
    SetMetadata('aiService', service),
    SetMetadata('aiPermission', permission),
    UseGuards(AIAuthGuard)
  ];

  if (options?.checkQuota) {
    decorators.push(SetMetadata('checkQuota', true));
  }

  return applyDecorators(...decorators);
};

/**
 * Specific decorators for each AI service
 */
export const ProposalPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.PROPOSAL, permission, { checkQuota });

export const ContentPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.CONTENT, permission, { checkQuota });

export const SupportPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.SUPPORT, permission, { checkQuota });

export const CRMPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = false
) => RequireAIPermission(AIServiceCategory.CRM, permission, { checkQuota });

export const MarketingPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.MARKETING, permission, { checkQuota });

export const ProjectPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = false
) => RequireAIPermission(AIServiceCategory.PROJECT, permission, { checkQuota });

export const AnalyticsPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.ANALYTICS, permission, { checkQuota });

export const VoiceAIPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.VOICE_AI, permission, { checkQuota });

export const BIPermission = (
  permission: AIServicePermission,
  checkQuota: boolean = true
) => RequireAIPermission(AIServiceCategory.BUSINESS_INTELLIGENCE, permission, { checkQuota });

/**
 * Common permission combinations
 */
export const ReadOnlyAI = (service: AIServiceCategory) => {
  const readPermissions = {
    [AIServiceCategory.PROPOSAL]: AIServicePermission.PROPOSAL_READ,
    [AIServiceCategory.CONTENT]: AIServicePermission.CONTENT_READ,
    [AIServiceCategory.SUPPORT]: AIServicePermission.SUPPORT_READ,
    [AIServiceCategory.CRM]: AIServicePermission.CRM_READ,
    [AIServiceCategory.MARKETING]: AIServicePermission.MARKETING_READ,
    [AIServiceCategory.PROJECT]: AIServicePermission.PROJECT_READ,
    [AIServiceCategory.ANALYTICS]: AIServicePermission.ANALYTICS_READ,
    [AIServiceCategory.VOICE_AI]: AIServicePermission.VOICE_AI_READ,
    [AIServiceCategory.BUSINESS_INTELLIGENCE]: AIServicePermission.BI_READ,
    [AIServiceCategory.SYSTEM]: AIServicePermission.SYSTEM_ADMIN
  };

  return RequireAIPermission(service, readPermissions[service], { checkQuota: false });
};

export const WriteAccess = (service: AIServiceCategory) => {
  const writePermissions = {
    [AIServiceCategory.PROPOSAL]: AIServicePermission.PROPOSAL_WRITE,
    [AIServiceCategory.CONTENT]: AIServicePermission.CONTENT_WRITE,
    [AIServiceCategory.SUPPORT]: AIServicePermission.SUPPORT_WRITE,
    [AIServiceCategory.CRM]: AIServicePermission.CRM_WRITE,
    [AIServiceCategory.MARKETING]: AIServicePermission.MARKETING_WRITE,
    [AIServiceCategory.PROJECT]: AIServicePermission.PROJECT_WRITE,
    [AIServiceCategory.ANALYTICS]: AIServicePermission.ANALYTICS_WRITE,
    [AIServiceCategory.VOICE_AI]: AIServicePermission.VOICE_AI_WRITE,
    [AIServiceCategory.BUSINESS_INTELLIGENCE]: AIServicePermission.BI_WRITE,
    [AIServiceCategory.SYSTEM]: AIServicePermission.SYSTEM_ADMIN
  };

  return RequireAIPermission(service, writePermissions[service], { checkQuota: true });
};

export const AdminAccess = (service: AIServiceCategory) => {
  const adminPermissions = {
    [AIServiceCategory.PROPOSAL]: AIServicePermission.PROPOSAL_ADMIN,
    [AIServiceCategory.CONTENT]: AIServicePermission.CONTENT_ADMIN,
    [AIServiceCategory.SUPPORT]: AIServicePermission.SUPPORT_ADMIN,
    [AIServiceCategory.CRM]: AIServicePermission.CRM_ADMIN,
    [AIServiceCategory.MARKETING]: AIServicePermission.MARKETING_ADMIN,
    [AIServiceCategory.PROJECT]: AIServicePermission.PROJECT_ADMIN,
    [AIServiceCategory.ANALYTICS]: AIServicePermission.ANALYTICS_ADMIN,
    [AIServiceCategory.VOICE_AI]: AIServicePermission.VOICE_AI_ADMIN,
    [AIServiceCategory.BUSINESS_INTELLIGENCE]: AIServicePermission.BI_ADMIN,
    [AIServiceCategory.SYSTEM]: AIServicePermission.SYSTEM_ADMIN
  };

  return RequireAIPermission(service, adminPermissions[service], { checkQuota: false });
};

/**
 * Utility decorator to just check quota without specific permissions
 */
export const CheckQuota = (service: AIServiceCategory) => {
  return applyDecorators(
    SetMetadata('aiService', service),
    SetMetadata('checkQuota', true),
    UseGuards(AIAuthGuard)
  );
};

/**
 * Decorator for high-usage AI operations that require special handling
 */
export const HighUsageAI = (
  service: AIServiceCategory,
  permission: AIServicePermission
) => {
  return applyDecorators(
    SetMetadata('aiService', service),
    SetMetadata('aiPermission', permission),
    SetMetadata('checkQuota', true),
    SetMetadata('highUsage', true),
    UseGuards(AIAuthGuard)
  );
};

