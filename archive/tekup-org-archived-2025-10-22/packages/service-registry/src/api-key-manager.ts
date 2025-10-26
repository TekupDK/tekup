import { createLogger } from './simple-logger.js';
import { APIKeyRotationResult, APIKeyRotationResultSchema } from './types.js';
import * as crypto from 'crypto';

export class APIKeyManager {
  private logger = createLogger('api-key-manager');
  private registry: any; // ServiceRegistry reference

  constructor(registry: any) {
    this.registry = registry;
  }

  /**
   * Rotate API key for a service
   */
  async rotateAPIKey(serviceId: string, newApiKey?: string): Promise<APIKeyRotationResult> {
    const startTime = Date.now();
    
    try {
      const service = this.registry.getService(serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      const oldKeyHash = this.hashApiKey(service.apiKey);
      
      // If no new key provided, generate one (this would depend on the service)
      if (!newApiKey) {
        const generatedKey = await this.generateApiKey(service);
        if (!generatedKey) {
          throw new Error(`Unable to generate new API key for service ${serviceId}`);
        }
        newApiKey = generatedKey;
      }

      const newKeyHash = this.hashApiKey(newApiKey);

      // Test the new API key before committing the change
      const testResult = await this.testApiKey(serviceId, newApiKey);
      if (!testResult.success) {
        throw new Error(`New API key failed validation: ${testResult.error}`);
      }

      // Update the service with the new API key
      await this.registry.updateService(serviceId, {
        apiKey: newApiKey,
        lastRotated: new Date()
      });

      // Calculate next rotation date (example: 90 days from now)
      const nextRotationDue = new Date();
      nextRotationDue.setDate(nextRotationDue.getDate() + 90);

      this.logger.info(`Successfully rotated API key for service: ${service.name} (${serviceId})`);

      return APIKeyRotationResultSchema.parse({
        serviceId,
        success: true,
        oldKeyHash,
        newKeyHash,
        rotatedAt: new Date(),
        nextRotationDue
      });

    } catch (error) {
      this.logger.error(`Failed to rotate API key for service ${serviceId}:`, error);
      
      return APIKeyRotationResultSchema.parse({
        serviceId,
        success: false,
        rotatedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test if an API key is valid for a service
   */
  async testApiKey(serviceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const service = this.registry.getService(serviceId);
      if (!service) {
        throw new Error(`Service ${serviceId} not found`);
      }

      // Create a test endpoint URL
      const testEndpoint = this.getTestEndpoint(service);
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          [service.apiKeyHeader]: `${service.apiKeyPrefix} ${apiKey}`,
          ...service.additionalHeaders,
          'User-Agent': 'TekUp-ServiceRegistry/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      // Check if the response indicates successful authentication
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Authentication failed' };
      }

      if (response.status >= 200 && response.status < 300) {
        return { success: true };
      }

      // For other status codes, consider it a success if it's not an auth error
      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate a new API key (service-specific logic)
   */
  private async generateApiKey(service: any): Promise<string | undefined> {
    // This is a placeholder - in reality, you'd need service-specific logic
    // to generate new API keys through their respective APIs
    
    switch (service.type) {
      case 'ai-provider':
        // For AI providers, you typically can't generate keys programmatically
        // They need to be created through their web interfaces
        this.logger.warn(`Cannot auto-generate API key for AI provider: ${service.name}`);
        return undefined;
        
      case 'payment':
        // Payment providers like Stripe have APIs for key management
        // This would require implementing their specific key rotation APIs
        this.logger.warn(`Cannot auto-generate API key for payment provider: ${service.name}`);
        return undefined;
        
      default:
        // For custom services, you might have your own key generation logic
        this.logger.warn(`Cannot auto-generate API key for service type: ${service.type}`);
        return undefined;
    }
  }

  /**
   * Get appropriate test endpoint for a service
   */
  private getTestEndpoint(service: any): string {
    // Service-specific test endpoints
    const testEndpoints: Record<string, string> = {
      'openai': 'https://api.openai.com/v1/models',
      'anthropic': 'https://api.anthropic.com/v1/messages',
      'gemini': 'https://generativelanguage.googleapis.com/v1/models',
      'stripe': 'https://api.stripe.com/v1/account',
      'convertkit': 'https://api.convertkit.com/v3/account',
      'hubspot': 'https://api.hubapi.com/account-info/v3/details',
      'plausible': 'https://plausible.io/api/v1/stats/breakdown'
    };

    // Try to match by provider name or service name
    const providerKey = service.provider.toLowerCase();
    const serviceKey = service.name.toLowerCase();
    
    if (testEndpoints[providerKey]) {
      return testEndpoints[providerKey];
    }
    
    if (testEndpoints[serviceKey]) {
      return testEndpoints[serviceKey];
    }

    // Fallback to health check endpoint or base URL
    if (service.healthCheck?.endpoint) {
      return service.healthCheck.endpoint;
    }

    // Default to base URL with common health check paths
    const baseUrl = service.baseUrl.endsWith('/') ? service.baseUrl.slice(0, -1) : service.baseUrl;
    return `${baseUrl}/health`;
  }

  /**
   * Hash API key for logging/tracking purposes
   */
  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
  }

  /**
   * Schedule automatic API key rotation
   */
  async scheduleRotation(serviceId: string, intervalDays: number = 90): Promise<void> {
    // This would integrate with a job scheduler like node-cron
    // For now, just log the intent
    this.logger.info(`Scheduled API key rotation for ${serviceId} every ${intervalDays} days`);
    
    // In a real implementation, you'd set up a cron job here
    // Example:
    // cron.schedule(`0 0 */${intervalDays} * *`, async () => {
    //   await this.rotateAPIKey(serviceId);
    // });
  }

  /**
   * Get API key rotation history for a service
   */
  getRotationHistory(serviceId: string): {
    lastRotated?: Date;
    rotationCount: number;
    nextDue?: Date;
  } {
    const service = this.registry.getService(serviceId);
    if (!service) {
      return { rotationCount: 0 };
    }

    // In a real implementation, this would come from a database
    return {
      lastRotated: service.lastRotated,
      rotationCount: service.lastRotated ? 1 : 0,
      nextDue: service.lastRotated ? new Date(service.lastRotated.getTime() + 90 * 24 * 60 * 60 * 1000) : undefined
    };
  }

  /**
   * Validate API key format for different service types
   */
  validateApiKeyFormat(serviceType: string, apiKey: string): { valid: boolean; error?: string } {
    const patterns: Record<string, RegExp> = {
      'openai': /^sk-[a-zA-Z0-9]{48}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9-_]{95}$/,
      'stripe': /^sk_(test|live)_[a-zA-Z0-9]{24}$/,
      'gemini': /^[a-zA-Z0-9-_]{39}$/
    };

    const pattern = patterns[serviceType.toLowerCase()];
    if (!pattern) {
      return { valid: true }; // No validation pattern available
    }

    if (!pattern.test(apiKey)) {
      return { 
        valid: false, 
        error: `API key format invalid for ${serviceType}` 
      };
    }

    return { valid: true };
  }
}