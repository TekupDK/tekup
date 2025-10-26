export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// AI Service Permissions
export enum AIServicePermission {
  // Proposal Engine
  PROPOSAL_READ = 'proposal:read',
  PROPOSAL_WRITE = 'proposal:write',
  PROPOSAL_ADMIN = 'proposal:admin',
  
  // Content Generation
  CONTENT_READ = 'content:read',
  CONTENT_WRITE = 'content:write',
  CONTENT_PUBLISH = 'content:publish',
  CONTENT_ADMIN = 'content:admin',
  
  // Customer Support
  SUPPORT_READ = 'support:read',
  SUPPORT_WRITE = 'support:write',
  SUPPORT_ESCALATE = 'support:escalate',
  SUPPORT_ADMIN = 'support:admin',
  
  // CRM & Leads
  CRM_READ = 'crm:read',
  CRM_WRITE = 'crm:write',
  CRM_DELETE = 'crm:delete',
  CRM_ADMIN = 'crm:admin',
  
  // Marketing Automation
  MARKETING_READ = 'marketing:read',
  MARKETING_WRITE = 'marketing:write',
  MARKETING_CAMPAIGN = 'marketing:campaign',
  MARKETING_ADMIN = 'marketing:admin',
  
  // Project Management
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  PROJECT_MANAGE = 'project:manage',
  PROJECT_ADMIN = 'project:admin',
  
  // AI Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  ANALYTICS_ADMIN = 'analytics:admin',
  
  // Voice AI & Computer Vision
  VOICE_AI_READ = 'voice:read',
  VOICE_AI_WRITE = 'voice:write',
  VOICE_AI_ADMIN = 'voice:admin',
  
  // Business Intelligence
  BI_READ = 'bi:read',
  BI_WRITE = 'bi:write',
  BI_ADMIN = 'bi:admin',
  
  // System Administration
  SYSTEM_ADMIN = 'system:admin',
  TENANT_ADMIN = 'tenant:admin'
}

// AI Service Categories
export enum AIServiceCategory {
  PROPOSAL = 'proposal',
  CONTENT = 'content', 
  SUPPORT = 'support',
  CRM = 'crm',
  MARKETING = 'marketing',
  PROJECT = 'project',
  ANALYTICS = 'analytics',
  VOICE_AI = 'voice',
  BUSINESS_INTELLIGENCE = 'bi',
  SYSTEM = 'system'
}

export interface LoginDto {
  email: string;
  password: string;
  tenantId?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  tenantId?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  role: UserRole;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenants: TenantInfo[];
}

export interface AuthResult {
  user: UserInfo;
  accessToken: string;
  expiresIn: string;
}

export interface TenantContext {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tenants: TenantInfo[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tenants: TenantInfo[];
  permissions?: AIServicePermission[];
  iat?: number;
  exp?: number;
}

// Extended tenant info with AI service access
export interface AITenantInfo extends TenantInfo {
  aiServicesEnabled: AIServiceCategory[];
  maxAIRequests?: number;
  customLimits?: Record<string, number>;
}

// AI Service Access Control
export interface AIServiceAccess {
  service: AIServiceCategory;
  permissions: AIServicePermission[];
  limits?: {
    dailyRequests?: number;
    monthlyRequests?: number;
    maxTokens?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

// Extended user context with AI permissions
export interface AIUserContext extends TenantContext {
  aiServiceAccess: AIServiceAccess[];
  quotaUsage?: Record<string, {
    used: number;
    limit: number;
    resetDate: Date;
  }>;
}

// AI Service Authentication Result
export interface AIAuthResult extends AuthResult {
  user: UserInfo & {
    aiServiceAccess: AIServiceAccess[];
  };
  serviceEndpoints?: Record<AIServiceCategory, string>;
}

// Permission validation interface
export interface PermissionCheck {
  service: AIServiceCategory;
  action: AIServicePermission;
  resourceId?: string;
  tenantId: string;
  userId: string;
}

// AI Service Configuration per tenant
export interface AIServiceConfig {
  tenantId: string;
  enabledServices: AIServiceCategory[];
  serviceConfigs: Record<AIServiceCategory, {
    enabled: boolean;
    limits: {
      dailyRequests: number;
      monthlyRequests: number;
      maxTokens?: number;
    };
    features: string[];
    customSettings?: Record<string, any>;
  }>;
}

// Usage tracking
export interface AIServiceUsage {
  tenantId: string;
  userId: string;
  service: AIServiceCategory;
  action: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  metadata?: Record<string, any>;
}
