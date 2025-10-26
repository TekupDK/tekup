import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@tekup/shared';
import { createLogger } from '@tekup/shared';
import { 
  AIServiceCategory, 
  AIServicePermission, 
  AIServiceAccess, 
  AIUserContext, 
  PermissionCheck,
  AIServiceConfig,
  AIServiceUsage,
  UserRole
} from '../types/auth.types.js';

const logger = createLogger('tekup-ai-auth-service');

@Injectable()
export class TekUpAIAuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Check if user has permission for AI service action
   */
  async checkPermission(check: PermissionCheck): Promise<boolean> {
    try {
      // Get user's AI service access
      const userAccess = await this.getUserAIAccess(check.userId, check.tenantId);
      
      // Find relevant service access
      const serviceAccess = userAccess.find(access => access.service === check.service);
      if (!serviceAccess) {
        return false;
      }

      // Check if user has the required permission
      return serviceAccess.permissions.includes(check.action);
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Get user's AI service access and permissions
   */
  async getUserAIAccess(userId: string, tenantId: string): Promise<AIServiceAccess[]> {
    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: {
        userId,
        tenantId
      },
      include: {
        user: true,
        tenant: true
      }
    });

    if (!tenantUser) {
      throw new UnauthorizedException('User not found in tenant');
    }

    return this.getRoleBasedPermissions(tenantUser.role as UserRole);
  }

  /**
   * Get role-based AI service permissions
   */
  private getRoleBasedPermissions(role: UserRole): AIServiceAccess[] {
    const permissions: AIServiceAccess[] = [];

    switch (role) {
      case UserRole.SUPER_ADMIN:
        // Super admin has access to everything
        permissions.push(...this.getAllAIServiceAccess());
        break;

      case UserRole.ADMIN:
        // Admin has access to most services with admin permissions
        permissions.push(
          {
            service: AIServiceCategory.PROPOSAL,
            permissions: [AIServicePermission.PROPOSAL_READ, AIServicePermission.PROPOSAL_WRITE, AIServicePermission.PROPOSAL_ADMIN],
            limits: { dailyRequests: 1000, monthlyRequests: 20000, priority: 'high' }
          },
          {
            service: AIServiceCategory.CONTENT,
            permissions: [AIServicePermission.CONTENT_READ, AIServicePermission.CONTENT_WRITE, AIServicePermission.CONTENT_PUBLISH, AIServicePermission.CONTENT_ADMIN],
            limits: { dailyRequests: 800, monthlyRequests: 15000, priority: 'high' }
          },
          {
            service: AIServiceCategory.SUPPORT,
            permissions: [AIServicePermission.SUPPORT_READ, AIServicePermission.SUPPORT_WRITE, AIServicePermission.SUPPORT_ESCALATE, AIServicePermission.SUPPORT_ADMIN],
            limits: { dailyRequests: 500, monthlyRequests: 10000, priority: 'high' }
          },
          {
            service: AIServiceCategory.CRM,
            permissions: [AIServicePermission.CRM_READ, AIServicePermission.CRM_WRITE, AIServicePermission.CRM_DELETE, AIServicePermission.CRM_ADMIN],
            limits: { dailyRequests: 800, monthlyRequests: 15000, priority: 'high' }
          },
          {
            service: AIServiceCategory.MARKETING,
            permissions: [AIServicePermission.MARKETING_READ, AIServicePermission.MARKETING_WRITE, AIServicePermission.MARKETING_CAMPAIGN, AIServicePermission.MARKETING_ADMIN],
            limits: { dailyRequests: 600, monthlyRequests: 12000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.PROJECT,
            permissions: [AIServicePermission.PROJECT_READ, AIServicePermission.PROJECT_WRITE, AIServicePermission.PROJECT_MANAGE, AIServicePermission.PROJECT_ADMIN],
            limits: { dailyRequests: 400, monthlyRequests: 8000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.ANALYTICS,
            permissions: [AIServicePermission.ANALYTICS_READ, AIServicePermission.ANALYTICS_WRITE, AIServicePermission.ANALYTICS_ADMIN],
            limits: { dailyRequests: 300, monthlyRequests: 6000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.VOICE_AI,
            permissions: [AIServicePermission.VOICE_AI_READ, AIServicePermission.VOICE_AI_WRITE, AIServicePermission.VOICE_AI_ADMIN],
            limits: { dailyRequests: 200, monthlyRequests: 4000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.BUSINESS_INTELLIGENCE,
            permissions: [AIServicePermission.BI_READ, AIServicePermission.BI_WRITE, AIServicePermission.BI_ADMIN],
            limits: { dailyRequests: 250, monthlyRequests: 5000, priority: 'medium' }
          }
        );
        break;

      case UserRole.MANAGER:
        // Manager has read/write access to most services
        permissions.push(
          {
            service: AIServiceCategory.PROPOSAL,
            permissions: [AIServicePermission.PROPOSAL_READ, AIServicePermission.PROPOSAL_WRITE],
            limits: { dailyRequests: 500, monthlyRequests: 10000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.CONTENT,
            permissions: [AIServicePermission.CONTENT_READ, AIServicePermission.CONTENT_WRITE, AIServicePermission.CONTENT_PUBLISH],
            limits: { dailyRequests: 400, monthlyRequests: 8000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.SUPPORT,
            permissions: [AIServicePermission.SUPPORT_READ, AIServicePermission.SUPPORT_WRITE, AIServicePermission.SUPPORT_ESCALATE],
            limits: { dailyRequests: 300, monthlyRequests: 6000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.CRM,
            permissions: [AIServicePermission.CRM_READ, AIServicePermission.CRM_WRITE],
            limits: { dailyRequests: 400, monthlyRequests: 8000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.MARKETING,
            permissions: [AIServicePermission.MARKETING_READ, AIServicePermission.MARKETING_WRITE, AIServicePermission.MARKETING_CAMPAIGN],
            limits: { dailyRequests: 300, monthlyRequests: 6000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.PROJECT,
            permissions: [AIServicePermission.PROJECT_READ, AIServicePermission.PROJECT_WRITE, AIServicePermission.PROJECT_MANAGE],
            limits: { dailyRequests: 200, monthlyRequests: 4000, priority: 'medium' }
          },
          {
            service: AIServiceCategory.ANALYTICS,
            permissions: [AIServicePermission.ANALYTICS_READ, AIServicePermission.ANALYTICS_WRITE],
            limits: { dailyRequests: 150, monthlyRequests: 3000, priority: 'low' }
          },
          {
            service: AIServiceCategory.VOICE_AI,
            permissions: [AIServicePermission.VOICE_AI_READ, AIServicePermission.VOICE_AI_WRITE],
            limits: { dailyRequests: 100, monthlyRequests: 2000, priority: 'low' }
          },
          {
            service: AIServiceCategory.BUSINESS_INTELLIGENCE,
            permissions: [AIServicePermission.BI_READ, AIServicePermission.BI_WRITE],
            limits: { dailyRequests: 100, monthlyRequests: 2000, priority: 'low' }
          }
        );
        break;

      case UserRole.USER:
        // Regular users have read access and limited write
        permissions.push(
          {
            service: AIServiceCategory.PROPOSAL,
            permissions: [AIServicePermission.PROPOSAL_READ, AIServicePermission.PROPOSAL_WRITE],
            limits: { dailyRequests: 100, monthlyRequests: 2000, priority: 'low' }
          },
          {
            service: AIServiceCategory.CONTENT,
            permissions: [AIServicePermission.CONTENT_READ, AIServicePermission.CONTENT_WRITE],
            limits: { dailyRequests: 50, monthlyRequests: 1000, priority: 'low' }
          },
          {
            service: AIServiceCategory.SUPPORT,
            permissions: [AIServicePermission.SUPPORT_READ, AIServicePermission.SUPPORT_WRITE],
            limits: { dailyRequests: 30, monthlyRequests: 600, priority: 'low' }
          },
          {
            service: AIServiceCategory.CRM,
            permissions: [AIServicePermission.CRM_READ, AIServicePermission.CRM_WRITE],
            limits: { dailyRequests: 80, monthlyRequests: 1600, priority: 'low' }
          },
          {
            service: AIServiceCategory.MARKETING,
            permissions: [AIServicePermission.MARKETING_READ],
            limits: { dailyRequests: 20, monthlyRequests: 400, priority: 'low' }
          },
          {
            service: AIServiceCategory.PROJECT,
            permissions: [AIServicePermission.PROJECT_READ, AIServicePermission.PROJECT_WRITE],
            limits: { dailyRequests: 40, monthlyRequests: 800, priority: 'low' }
          },
          {
            service: AIServiceCategory.ANALYTICS,
            permissions: [AIServicePermission.ANALYTICS_READ],
            limits: { dailyRequests: 25, monthlyRequests: 500, priority: 'low' }
          },
          {
            service: AIServiceCategory.VOICE_AI,
            permissions: [AIServicePermission.VOICE_AI_READ],
            limits: { dailyRequests: 15, monthlyRequests: 300, priority: 'low' }
          },
          {
            service: AIServiceCategory.BUSINESS_INTELLIGENCE,
            permissions: [AIServicePermission.BI_READ],
            limits: { dailyRequests: 20, monthlyRequests: 400, priority: 'low' }
          }
        );
        break;
    }

    return permissions;
  }

  /**
   * Get all possible AI service access (for super admin)
   */
  private getAllAIServiceAccess(): AIServiceAccess[] {
    return [
      {
        service: AIServiceCategory.PROPOSAL,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('proposal:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.CONTENT,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('content:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.SUPPORT,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('support:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.CRM,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('crm:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.MARKETING,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('marketing:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.PROJECT,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('project:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.ANALYTICS,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('analytics:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.VOICE_AI,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('voice:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.BUSINESS_INTELLIGENCE,
        permissions: Object.values(AIServicePermission).filter(p => p.startsWith('bi:')),
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      },
      {
        service: AIServiceCategory.SYSTEM,
        permissions: [AIServicePermission.SYSTEM_ADMIN, AIServicePermission.TENANT_ADMIN],
        limits: { dailyRequests: 10000, monthlyRequests: 200000, priority: 'critical' }
      }
    ];
  }

  /**
   * Track AI service usage
   */
  async trackUsage(usage: AIServiceUsage): Promise<void> {
    try {
      // In a real implementation, this would store to a time-series database
      // For now, we'll log the usage
      logger.info('AI Service Usage:', {
        tenantId: usage.tenantId,
        userId: usage.userId,
        service: usage.service,
        action: usage.action,
        tokens: usage.tokens,
        cost: usage.cost,
        timestamp: usage.timestamp
      });

      // Store usage in database for quota tracking
      // This would typically go to a separate usage tracking table
      
    } catch (error) {
      logger.error('Failed to track AI service usage:', error);
    }
  }

  /**
   * Check if user has remaining quota for service
   */
  async checkQuota(
    userId: string, 
    tenantId: string, 
    service: AIServiceCategory,
    requestedTokens: number = 1
  ): Promise<{ allowed: boolean; remaining: number; resetDate: Date }> {
    try {
      const userAccess = await this.getUserAIAccess(userId, tenantId);
      const serviceAccess = userAccess.find(access => access.service === service);
      
      if (!serviceAccess?.limits) {
        return { allowed: true, remaining: -1, resetDate: new Date() };
      }

      // Get current usage (simplified - in production would query usage database)
      const dailyLimit = serviceAccess.limits.dailyRequests || 100;
      const currentUsage = 0; // This would be queried from usage tracking
      
      const remaining = dailyLimit - currentUsage;
      const allowed = remaining >= requestedTokens;
      
      // Reset date would be next midnight
      const resetDate = new Date();
      resetDate.setHours(24, 0, 0, 0);
      
      return { allowed, remaining, resetDate };
    } catch (error) {
      logger.error('Quota check failed:', error);
      return { allowed: false, remaining: 0, resetDate: new Date() };
    }
  }

  /**
   * Get tenant's AI service configuration
   */
  async getTenantAIConfig(tenantId: string): Promise<AIServiceConfig> {
    // In production, this would be stored in database
    // For now, return default configuration
    return {
      tenantId,
      enabledServices: Object.values(AIServiceCategory),
      serviceConfigs: {
        [AIServiceCategory.PROPOSAL]: {
          enabled: true,
          limits: { dailyRequests: 1000, monthlyRequests: 20000 },
          features: ['buying_signal_detection', 'research_integration', 'document_generation']
        },
        [AIServiceCategory.CONTENT]: {
          enabled: true,
          limits: { dailyRequests: 800, monthlyRequests: 15000 },
          features: ['blog_generation', 'social_media', 'email_content', 'seo_optimization']
        },
        [AIServiceCategory.SUPPORT]: {
          enabled: true,
          limits: { dailyRequests: 500, monthlyRequests: 10000 },
          features: ['chatbot', 'ticket_routing', 'sentiment_analysis', 'knowledge_base']
        },
        [AIServiceCategory.CRM]: {
          enabled: true,
          limits: { dailyRequests: 800, monthlyRequests: 15000 },
          features: ['lead_scoring', 'contact_enrichment', 'deal_insights', 'automation']
        },
        [AIServiceCategory.MARKETING]: {
          enabled: true,
          limits: { dailyRequests: 600, monthlyRequests: 12000 },
          features: ['campaign_optimization', 'audience_segmentation', 'content_personalization']
        },
        [AIServiceCategory.PROJECT]: {
          enabled: true,
          limits: { dailyRequests: 400, monthlyRequests: 8000 },
          features: ['task_automation', 'resource_optimization', 'timeline_prediction']
        },
        [AIServiceCategory.ANALYTICS]: {
          enabled: true,
          limits: { dailyRequests: 300, monthlyRequests: 6000 },
          features: ['predictive_analytics', 'anomaly_detection', 'forecasting']
        },
        [AIServiceCategory.VOICE_AI]: {
          enabled: true,
          limits: { dailyRequests: 200, monthlyRequests: 4000 },
          features: ['speech_to_text', 'text_to_speech', 'voice_analysis']
        },
        [AIServiceCategory.BUSINESS_INTELLIGENCE]: {
          enabled: true,
          limits: { dailyRequests: 250, monthlyRequests: 5000 },
          features: ['report_generation', 'dashboard_automation', 'data_visualization']
        },
        [AIServiceCategory.SYSTEM]: {
          enabled: true,
          limits: { dailyRequests: 100, monthlyRequests: 2000 },
          features: ['system_monitoring', 'performance_optimization']
        }
      }
    };
  }

  /**
   * Validate AI service request
   */
  async validateAIRequest(
    userId: string,
    tenantId: string,
    service: AIServiceCategory,
    action: AIServicePermission,
    requestedTokens?: number
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check permission
      const hasPermission = await this.checkPermission({
        service,
        action,
        tenantId,
        userId
      });

      if (!hasPermission) {
        return { valid: false, reason: 'Insufficient permissions' };
      }

      // Check quota
      const quotaCheck = await this.checkQuota(userId, tenantId, service, requestedTokens);
      if (!quotaCheck.allowed) {
        return { valid: false, reason: 'Quota exceeded' };
      }

      return { valid: true };
    } catch (error) {
      logger.error('AI request validation failed:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }
}

