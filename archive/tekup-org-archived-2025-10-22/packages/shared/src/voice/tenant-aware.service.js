import { GeminiLiveService } from './gemini-live.service';
import { createLogger } from '../logging/logger';
const logger = createLogger('packages-shared-src-voice-tena');
export class TenantAwareVoiceService {
    geminiService;
    currentTenant = '';
    tenantSettings = null;
    tenantApiKey = '';
    allowedTenants = ['rendetalje', 'foodtruck', 'tekup'];
    isActive = false;
    constructor(apiKey) {
        this.geminiService = new GeminiLiveService(apiKey);
        this.tenantApiKey = apiKey;
    }
    async initializeTenant(tenant) {
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
        }
        catch (error) {
            logger.error(`❌ Fejl ved initialisering af tenant ${tenant}:`);
            throw error;
        }
    }
    async switchTenant(newTenant, userId) {
        try {
            const switchRequest = {
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
        }
        catch (error) {
            logger.error(`❌ Fejl ved tenant switch til ${newTenant}:`);
            throw error;
        }
    }
    async loadTenantSettings(tenant) {
        try {
            // Simuler tenant settings (i produktion ville dette komme fra API)
            const mockSettings = {
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
        }
        catch (error) {
            logger.error(`❌ Fejl ved indlæsning af tenant settings for ${tenant}:`);
            throw error;
        }
    }
    getTenantSettings() {
        return this.tenantSettings;
    }
    getBrandName(tenant) {
        const brandNames = {
            'rendetalje': 'Rendetalje',
            'foodtruck': 'FoodTruck',
            'tekup': 'TekUp'
        };
        return brandNames[tenant] || tenant;
    }
    getPrimaryColor(tenant) {
        const colors = {
            'rendetalje': '#059669',
            'foodtruck': '#dc2626',
            'tekup': '#7c3aed'
        };
        return colors[tenant] || '#7c3aed';
    }
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '124, 58, 237';
    }
    async executeVoiceCommand(command, parameters = {}) {
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
            const response = await this.geminiService.processVoiceCommand(Buffer.from(JSON.stringify(tenantAwareParams)));
            return response;
        }
        catch (error) {
            logger.error(`❌ Fejl ved execution af voice command ${command.name}:`);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                tenant: this.currentTenant,
                timestamp: new Date()
            };
        }
    }
    getTenantContext() {
        return {
            currentTenant: this.currentTenant,
            tenantSettings: this.tenantSettings || {},
            tenantApiKey: this.tenantApiKey,
            allowedTenants: this.allowedTenants,
            isTenantActive: this.isActive
        };
    }
    getCurrentTenant() {
        return this.currentTenant;
    }
    isTenantActive() {
        return this.isActive;
    }
    getAllowedTenants() {
        return this.allowedTenants;
    }
    async cleanup() {
        if (this.isActive) {
            await this.geminiService.disconnect();
            this.isActive = false;
            this.currentTenant = '';
            this.tenantSettings = null;
        }
    }
}
//# sourceMappingURL=tenant-aware.service.js.map