import { GeminiLiveService } from './gemini-live.service';
import { TenantContext, TenantSettings, TenantSwitchRequest } from './types/tenant.types';
import { VoiceResponse, VoiceCommand } from './types/voice.types';
import { isTenantAware } from './types/tenant-aware.interface';
import { createLogger } from '../logging/logger';

const logger = createLogger('packages-shared-src-voice-tena');

export class TenantAwareVoiceService implements isTenantAware {
  private geminiService: GeminiLiveService;
  private currentTenant: string = '';
  private tenantSettings: TenantSettings | null = null;
  private tenantApiKey: string = '';
  private allowedTenants: string[] = ['rendetalje', 'foodtruck', 'tekup'];
  private isActive: boolean = false;

  constructor(apiKey: string) {
    this.geminiService = new GeminiLiveService(apiKey);
    this.tenantApiKey = apiKey;
  }

  async initializeTenant(tenant: string): Promise<void> {
    try {
      // Valider tenant
      if (!this.allowedTenants.includes(tenant)) {
        throw new Error(`Ugyldig tenant: ${tenant}`);
      }

      // Hent tenant settings
      await this.loadTenantSettings(tenant);

      // Start Gemini Live session for denne tenant
      await this.geminiService.connect(tenant, this.tenantSettings);

      this.currentTenant = tenant;
      this.isActive = true;

      logger.info(`✅ Tenant ${tenant} initialiseret for voice agent`);

    } catch (error) {
      logger.error(`❌ Fejl ved initialisering af tenant ${tenant}:`);
      throw error;
    }
  }

  async switchTenant(newTenant: string, userId: string): Promise<void> {
    try {
      const switchRequest: TenantSwitchRequest = {
        fromTenant: this.currentTenant,
        toTenant: newTenant,
        userId,
        timestamp: new Date()
      };

      // Log tenant switch
      logger.info(`🔄 Tenant switch: ${this.currentTenant} → ${newTenant}`);

      // Luk nuværende session
      if (this.isActive) {
        await this.geminiService.disconnect();
      }

      // Initialiser ny tenant
      await this.initializeTenant(newTenant);

      // Log successful switch
      logger.info(`✅ Tenant switch completed: ${newTenant}`);

    } catch (error) {
      logger.error(`❌ Fejl ved tenant switch til ${newTenant}:`);
      throw error;
    }
  }

  private async loadTenantSettings(tenant: string): Promise<void> {
    try {
      // Simuler tenant settings (i produktion ville dette komme fra API)
      const mockSettings: TenantSettings = {
        id: tenant,
        name: tenant,
        brand_display_name: this.getBrandName(tenant),
        theme_primary_color: this.getPrimaryColor(tenant),
        theme_primary_color_rgb: this.hexToRgb(this.getPrimaryColor(tenant)),
        domain: `${tenant}.tekup.dk`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      this.tenantSettings = mockSettings;

    } catch (error) {
      logger.error(`❌ Fejl ved indlæsning af tenant settings for ${tenant}:`);
      throw error;
    }
  }

  getTenantSettings(): TenantSettings | null {
    return this.tenantSettings;
  }

  private getBrandName(tenant: string): string {
    const brandNames: Record<string, string> = {
      'rendetalje': 'Rendetalje',
      'foodtruck': 'FoodTruck',
      'tekup': 'TekUp'
    };
    return brandNames[tenant] || tenant;
  }

  private getPrimaryColor(tenant: string): string {
    const colors: Record<string, string> = {
      'rendetalje': '#059669',
      'foodtruck': '#dc2626',
      'tekup': '#7c3aed'
    };
    return colors[tenant] || '#7c3aed';
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '124, 58, 237';
  }

  async executeVoiceCommand(command: VoiceCommand, parameters: any = {}): Promise<VoiceResponse> {
    try {
      // Valider tenant context
      if (command.tenant_required && !this.isTenantActive) {
        throw new Error('Tenant context påkrævet for denne kommando');
      }

      // Tilføj tenant context til parameters
      const tenantAwareParams = {
        ...parameters,
        tenant_id: this.currentTenant,
        tenant_context: {
          name: this.currentTenant,
          settings: this.tenantSettings
        }
      };

      // Execute command via Gemini
      const response = await this.geminiService.processVoiceCommand(
        Buffer.from(JSON.stringify(tenantAwareParams))
      );

      return response;

    } catch (error) {
      logger.error(`❌ Fejl ved execution af voice command ${command.name}:`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tenant: this.currentTenant,
        timestamp: new Date()
      };
    }
  }

  getTenantContext(): TenantContext {
    return {
      currentTenant: this.currentTenant,
      tenantSettings: this.tenantSettings || {} as TenantSettings,
      tenantApiKey: this.tenantApiKey,
      allowedTenants: this.allowedTenants,
      isTenantActive: this.isActive
    };
  }

  getCurrentTenant(): string {
    return this.currentTenant;
  }

  isTenantActive(): boolean {
    return this.isActive;
  }

  getAllowedTenants(): string[] {
    return this.allowedTenants;
  }

  async cleanup(): Promise<void> {
    if (this.isActive) {
      await this.geminiService.disconnect();
      this.isActive = false;
      this.currentTenant = '';
      this.tenantSettings = null;
    }
  }
}
