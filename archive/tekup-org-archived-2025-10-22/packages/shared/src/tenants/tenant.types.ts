import { VoiceCommandRequest, VoiceCommandResponse } from "../events/voice-command.types";

export interface Tenant {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    // Custom fields for tenant-specific settings
    settings?: Record<string, any>;
    // Branding information
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
    // Feature flags for the tenant
    featureFlags?: Record<string, boolean>;
  }
  
  export interface TenantCreationRequest extends Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> {}
  
  export interface TenantUpdateRequest extends Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>> {}
  
  export interface TenantAware {
    tenantId: string;
  }
  
  export interface TenantCommand extends TenantAware {
    command: string;
    payload: VoiceCommandRequest;
  }
  
  export interface TenantCommandResponse extends TenantAware {
    command: string;
    response: VoiceCommandResponse;
  }