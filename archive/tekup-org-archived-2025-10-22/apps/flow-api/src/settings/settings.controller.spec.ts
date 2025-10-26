import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ScopesGuard } from '../auth/scopes.guard.js';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsService: SettingsService;

  const mockSettingsService = {
    getResolved: jest.fn(),
    update: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        tenantId: 'test-tenant',
        apiKeyInfo: { 
          key: 'test-key',
          scopes: ['manage:settings', 'view:settings'],
          tenantId: 'test-tenant'
        }
      })),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    })
    .overrideGuard(ApiKeyGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(ScopesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<SettingsController>(SettingsController);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should return resolved settings for tenant', async () => {
      const mockSettings = {
        sla_response_minutes: 60,
        duplicate_window_minutes: 60,
        enable_advanced_parser: false,
        brand_display_name: 'Test Brand',
        theme_primary_color: '#ff0000'
      };
      
      mockSettingsService.getResolved.mockResolvedValue(mockSettings);

      const result = await controller.get('test-tenant');

      expect(result).toEqual({ settings: mockSettings });
      expect(settingsService.getResolved).toHaveBeenCalledWith('test-tenant');
    });

    it('should handle service errors', async () => {
      mockSettingsService.getResolved.mockRejectedValue(new Error('Database error'));

      await expect(controller.get('test-tenant')).rejects.toThrow('Database error');
      expect(settingsService.getResolved).toHaveBeenCalledWith('test-tenant');
    });
  });

  describe('patch', () => {
    const mockApiKeyInfo = { 
      keyId: 'test-key',
      scopes: ['manage:settings'],
      tenantId: 'test-tenant'
    };

    const validUpdates = {
      sla_response_minutes: 45,
      theme_primary_color: '#00ff00',
      brand_display_name: 'Updated Brand'
    };

    it('should update settings successfully', async () => {
      const mockUpdatedSettings = {
        ...validUpdates,
        duplicate_window_minutes: 60,
        enable_advanced_parser: false
      };
      
      mockSettingsService.update.mockResolvedValue(mockUpdatedSettings);

      const result = await controller.patch('test-tenant', mockApiKeyInfo as any, { updates: validUpdates });

      expect(result).toEqual({ settings: mockUpdatedSettings });
      expect(settingsService.update).toHaveBeenCalledWith('test-tenant', validUpdates, 'test-key');
    });

    it('should handle validation errors from service', async () => {
      mockSettingsService.update.mockRejectedValue(new Error('invalid_theme_primary_color'));

      await expect(controller.patch('test-tenant', mockApiKeyInfo as any, {
        updates: { theme_primary_color: 'invalid-color' }
      })).rejects.toThrow('invalid_theme_primary_color');
    });

    it('should handle no_valid_keys error', async () => {
      mockSettingsService.update.mockRejectedValue(new Error('no_valid_keys'));

      await expect(controller.patch('test-tenant', mockApiKeyInfo as any, {
        updates: { invalid_key: 'value' }
      })).rejects.toThrow('no_valid_keys');
    });

    it('should pass API key ID as actor', async () => {
      mockSettingsService.update.mockResolvedValue({});

      await controller.patch('test-tenant', mockApiKeyInfo as any, { updates: validUpdates });

      expect(settingsService.update).toHaveBeenCalledWith('test-tenant', validUpdates, 'test-key');
    });

    it('should handle updates with multiple fields', async () => {
      const multipleUpdates = {
        sla_response_minutes: 30,
        duplicate_window_minutes: 90,
        enable_advanced_parser: true,
        brand_display_name: 'Multi-field Update',
        theme_primary_color: '#123456'
      };

      mockSettingsService.update.mockResolvedValue(multipleUpdates);

      const result = await controller.patch('test-tenant', mockApiKeyInfo as any, { updates: multipleUpdates });

      expect(result).toEqual({ settings: multipleUpdates });
      expect(settingsService.update).toHaveBeenCalledWith('test-tenant', multipleUpdates, 'test-key');
    });

    it('should handle empty updates object', async () => {
      mockSettingsService.update.mockRejectedValue(new Error('no_valid_keys'));

      await expect(controller.patch('test-tenant', mockApiKeyInfo as any, { updates: {} }))
        .rejects.toThrow('no_valid_keys');
    });

    it('should handle missing updates in body', async () => {
      mockSettingsService.update.mockRejectedValue(new Error('no_valid_keys'));

      await expect(controller.patch('test-tenant', mockApiKeyInfo as any, {}))
        .rejects.toThrow('no_valid_keys');
    });
  });

  describe('authorization', () => {
    it('should have correct route guards configured', () => {
      const controllerGuards = Reflect.getMetadata('__guards__', SettingsController);
      expect(controllerGuards).toBeDefined();
    });

    it('should require manage:settings scope for updates', () => {
      const updateMethodScopes = Reflect.getMetadata('__scopes__', controller.patch);
      expect(updateMethodScopes).toContain('manage:settings');
    });

    // Note: GET endpoint doesn't explicitly require scopes in current implementation
    // but is protected by ApiKeyGuard and ScopesGuard at controller level
  });

  describe('tenant context', () => {
    it('should use tenant ID from path parameter', async () => {
      mockSettingsService.getResolved.mockResolvedValue({});

      await controller.get('specific-tenant');

      expect(settingsService.getResolved).toHaveBeenCalledWith('specific-tenant');
    });

    it('should use tenant ID from path for updates', async () => {
      const mockApiKeyInfo = { keyId: 'test-key' };
      
      mockSettingsService.update.mockResolvedValue({});

      await controller.patch('specific-tenant', mockApiKeyInfo as any, { updates: { sla_response_minutes: 60 } });

      expect(settingsService.update).toHaveBeenCalledWith('specific-tenant', expect.any(Object), 'test-key');
    });
  });

  describe('error handling', () => {
    it('should propagate service errors', async () => {
      const serviceError = new Error('Service unavailable');
      mockSettingsService.getResolved.mockRejectedValue(serviceError);

      await expect(controller.get('test-tenant')).rejects.toThrow('Service unavailable');
    });

    it('should handle database connection errors', async () => {
      mockSettingsService.update.mockRejectedValue(new Error('Database connection failed'));

      const mockApiKeyInfo = { keyId: 'test-key' };
      
      await expect(controller.patch('test-tenant', mockApiKeyInfo as any, { 
        updates: { sla_response_minutes: 60 }
      })).rejects.toThrow('Database connection failed');
    });
  });
});
