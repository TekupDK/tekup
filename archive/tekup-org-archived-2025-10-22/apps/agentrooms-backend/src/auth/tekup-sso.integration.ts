import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TekUpSSOService, TenantContext, UserRole } from '@tekup/sso';
import { createLogger } from '@tekup/shared';

const logger = createLogger('agentrooms-tekup-sso');

@Injectable()
export class AgentRoomsTekUpSSOIntegration {
  constructor(private readonly ssoService: TekUpSSOService) {}

  /**
   * Authenticate user for AgentRooms with tenant workspace isolation
   */
  async authenticateUser(token: string): Promise<AgentRoomsUserContext> {
    try {
      const tenantContext = await this.ssoService.verifyToken(token);
      
      // Create AgentRooms-specific user context
      const agentRoomsContext: AgentRoomsUserContext = {
        userId: tenantContext.userId,
        email: tenantContext.email,
        role: this.mapToAgentRoomsRole(tenantContext.role),
        tenantId: tenantContext.tenantId,
        workspaceId: `workspace_${tenantContext.tenantId}`, // Multi-tenant workspaces
        permissions: this.getAgentRoomsPermissions(tenantContext.role),
        subscription: await this.getSubscriptionInfo(tenantContext.tenantId)
      };

      logger.info(`AgentRooms user ${tenantContext.email} authenticated for workspace ${agentRoomsContext.workspaceId}`);
      
      return agentRoomsContext;
    } catch (error) {
      logger.error('AgentRooms authentication failed:', error);
      throw new UnauthorizedException('Invalid authentication for AgentRooms');
    }
  }

  /**
   * Create multi-tenant workspace for development teams
   */
  async createDevelopmentWorkspace(tenantId: string, teamName: string): Promise<AgentRoomsWorkspace> {
    const workspace: AgentRoomsWorkspace = {
      id: `workspace_${tenantId}`,
      name: `${teamName} Development`,
      tenantId,
      settings: {
        maxAgents: 5, // Default limit
        maxProjects: 10,
        collaborationEnabled: true,
        claudeIntegration: true,
        danishLanguageSupport: true // Nordic market feature
      },
      createdAt: new Date(),
      subscription: {
        plan: 'team_basic',
        status: 'active',
        maxUsers: 5,
        features: ['multi-agent', 'collaboration', 'claude-integration']
      }
    };

    logger.info(`Created AgentRooms workspace ${workspace.id} for tenant ${tenantId}`);
    
    return workspace;
  }

  /**
   * Map TekUp SSO roles to AgentRooms-specific roles
   */
  private mapToAgentRoomsRole(ssoRole: UserRole): AgentRoomsRole {
    switch (ssoRole) {
      case UserRole.SUPER_ADMIN:
        return AgentRoomsRole.PLATFORM_ADMIN;
      case UserRole.ADMIN:
        return AgentRoomsRole.WORKSPACE_ADMIN;
      case UserRole.MANAGER:
        return AgentRoomsRole.TEAM_LEAD;
      case UserRole.USER:
        return AgentRoomsRole.DEVELOPER;
      default:
        return AgentRoomsRole.DEVELOPER;
    }
  }

  /**
   * Get AgentRooms-specific permissions based on role
   */
  private getAgentRoomsPermissions(role: UserRole): AgentRoomsPermission[] {
    const permissions: AgentRoomsPermission[] = [
      AgentRoomsPermission.CREATE_AGENTS,
      AgentRoomsPermission.MANAGE_PROJECTS,
      AgentRoomsPermission.COLLABORATE
    ];

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      permissions.push(
        AgentRoomsPermission.MANAGE_WORKSPACE,
        AgentRoomsPermission.MANAGE_USERS,
        AgentRoomsPermission.VIEW_ANALYTICS
      );
    }

    if (role === UserRole.MANAGER) {
      permissions.push(
        AgentRoomsPermission.MANAGE_TEAM,
        AgentRoomsPermission.VIEW_ANALYTICS
      );
    }

    return permissions;
  }

  /**
   * Get subscription information for billing integration
   */
  private async getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo> {
    // This would integrate with TekUp billing system
    return {
      plan: 'team_basic',
      status: 'active',
      maxUsers: 5,
      maxAgents: 10,
      features: [
        'multi-agent-collaboration',
        'claude-integration', 
        'real-time-coding',
        'danish-language-support'
      ],
      billingCycle: 'monthly',
      amount: 300, // €300/month for team plan
      currency: 'EUR'
    };
  }
}

// AgentRooms-specific types
export interface AgentRoomsUserContext {
  userId: string;
  email: string;
  role: AgentRoomsRole;
  tenantId?: string;
  workspaceId: string;
  permissions: AgentRoomsPermission[];
  subscription: SubscriptionInfo;
}

export interface AgentRoomsWorkspace {
  id: string;
  name: string;
  tenantId: string;
  settings: WorkspaceSettings;
  createdAt: Date;
  subscription: SubscriptionInfo;
}

export interface WorkspaceSettings {
  maxAgents: number;
  maxProjects: number;
  collaborationEnabled: boolean;
  claudeIntegration: boolean;
  danishLanguageSupport: boolean;
}

export interface SubscriptionInfo {
  plan: string;
  status: 'active' | 'inactive' | 'trial';
  maxUsers: number;
  maxAgents?: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
}

export enum AgentRoomsRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  WORKSPACE_ADMIN = 'WORKSPACE_ADMIN',
  TEAM_LEAD = 'TEAM_LEAD',
  DEVELOPER = 'DEVELOPER'
}

export enum AgentRoomsPermission {
  CREATE_AGENTS = 'CREATE_AGENTS',
  MANAGE_PROJECTS = 'MANAGE_PROJECTS',
  COLLABORATE = 'COLLABORATE',
  MANAGE_WORKSPACE = 'MANAGE_WORKSPACE',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_TEAM = 'MANAGE_TEAM',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS'
}
