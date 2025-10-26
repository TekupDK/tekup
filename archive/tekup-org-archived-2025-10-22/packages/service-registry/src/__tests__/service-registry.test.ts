import { ServiceRegistry } from '../service-registry';
import { ExternalService } from '../types';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  afterEach(async () => {
    await registry.stopMonitoring();
  });

  describe('Service Registration', () => {
    it('should register a new service successfully', async () => {
      const serviceConfig: Partial<ExternalService> = {
        name: 'Test Service',
        type: 'api',
        provider: 'TestProvider',
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key-123'
      };

      const result = await registry.registerService(serviceConfig);

      expect(result.success).toBe(true);
      expect(result.serviceId).toBeDefined();
      expect(result.operation).toBe('register');
    });

    it('should prevent duplicate service registration', async () => {
      const serviceConfig: Partial<ExternalService> = {
        id: 'test-service',
        name: 'Test Service',
        type: 'api',
        provider: 'TestProvider',
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key-123'
      };

      await registry.registerService(serviceConfig);
      const result = await registry.registerService(serviceConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should validate service configuration', async () => {
      const invalidConfig = {
        name: '', // Invalid: empty name
        type: 'invalid-type', // Invalid: not in enum
        baseUrl: 'not-a-url', // Invalid: not a URL
        apiKey: '' // Invalid: empty API key
      };

      const result = await registry.registerService(invalidConfig as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Service Management', () => {
    let serviceId: string;

    beforeEach(async () => {
      const result = await registry.registerService({
        name: 'Test Service',
        type: 'api',
        provider: 'TestProvider',
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key-123'
      });
      serviceId = result.serviceId;
    });

    it('should retrieve a service by ID', () => {
      const service = registry.getService(serviceId);
      expect(service).toBeDefined();
      expect(service?.name).toBe('Test Service');
    });

    it('should update service configuration', async () => {
      const result = await registry.updateService(serviceId, {
        description: 'Updated description'
      });

      expect(result.success).toBe(true);
      
      const service = registry.getService(serviceId);
      expect(service?.description).toBe('Updated description');
    });

    it('should remove a service', async () => {
      const result = await registry.removeService(serviceId);
      expect(result.success).toBe(true);

      const service = registry.getService(serviceId);
      expect(service).toBeUndefined();
    });

    it('should toggle service enabled status', async () => {
      const result = await registry.toggleService(serviceId, false);
      expect(result.success).toBe(true);

      const service = registry.getService(serviceId);
      expect(service?.enabled).toBe(false);
    });
  });

  describe('Service Filtering', () => {
    beforeEach(async () => {
      await registry.registerService({
        name: 'AI Service',
        type: 'ai-provider',
        provider: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiKey: 'test-key-1',
        enabled: true
      });

      await registry.registerService({
        name: 'Payment Service',
        type: 'payment',
        provider: 'Stripe',
        baseUrl: 'https://api.stripe.com',
        apiKey: 'test-key-2',
        enabled: false
      });
    });

    it('should filter services by type', () => {
      const aiServices = registry.getServices({ type: 'ai-provider' });
      expect(aiServices).toHaveLength(1);
      expect(aiServices[0].name).toBe('AI Service');
    });

    it('should filter services by enabled status', () => {
      const enabledServices = registry.getServices({ enabled: true });
      expect(enabledServices).toHaveLength(1);
      expect(enabledServices[0].name).toBe('AI Service');

      const disabledServices = registry.getServices({ enabled: false });
      expect(disabledServices).toHaveLength(1);
      expect(disabledServices[0].name).toBe('Payment Service');
    });
  });

  describe('Configuration Export/Import', () => {
    beforeEach(async () => {
      await registry.registerService({
        name: 'Test Service',
        type: 'api',
        provider: 'TestProvider',
        baseUrl: 'https://api.test.com',
        apiKey: 'secret-key-123'
      });
    });

    it('should export configuration with masked secrets', () => {
      const config = registry.exportConfig(true);
      expect(config.services).toHaveLength(1);
      expect(config.services[0].apiKey).toContain('***');
      expect(config.services[0].apiKey).not.toBe('secret-key-123');
    });

    it('should export configuration with unmasked secrets', () => {
      const config = registry.exportConfig(false);
      expect(config.services).toHaveLength(1);
      expect(config.services[0].apiKey).toBe('secret-key-123');
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await registry.registerService({
        name: 'AI Service',
        type: 'ai-provider',
        provider: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiKey: 'test-key-1',
        enabled: true
      });

      await registry.registerService({
        name: 'Payment Service',
        type: 'payment',
        provider: 'Stripe',
        baseUrl: 'https://api.stripe.com',
        apiKey: 'test-key-2',
        enabled: false
      });
    });

    it('should provide accurate statistics', () => {
      const stats = registry.getStats();
      
      expect(stats.totalServices).toBe(2);
      expect(stats.enabledServices).toBe(1);
      expect(stats.servicesByType['ai-provider']).toBe(1);
      expect(stats.servicesByType['payment']).toBe(1);
    });
  });
});