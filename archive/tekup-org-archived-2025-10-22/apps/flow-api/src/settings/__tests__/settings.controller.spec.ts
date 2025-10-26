import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from '../settings.controller.js';
import { SettingsService } from '../settings.service.js';
import { ApiKeyGuard } from '../../auth/api-key.guard.js';
import { ScopesGuard } from '../../auth/scopes.guard.js';
import { Reflector } from '@nestjs/core';
import { SCOPE_MANAGE_SETTINGS } from '../../auth/scopes.constants.js';
import type { ApiKeyInfo } from '../../auth/api-key-info.decorator.js';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsService: SettingsService;

  const mockSettingsService = {
    getResolved: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        Reflector,
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

  describe('get', () => {
    it('should return resolved settings', async () => {
      const tenantId = 'tenant-123';
      const mockSettings = {
        brand_display_name: 'Test Brand',
        duplicate_window_minutes: 5,
      };

      mockSettingsService.getResolved.mockResolvedValue(mockSettings);

      const result = await controller.get(tenantId);

      expect(result).toEqual({ settings: mockSettings });
      expect(mockSettingsService.getResolved).toHaveBeenCalledWith(tenantId);
    });

    it('should pass through service errors', async () => {
      const tenantId = 'tenant-123';
      const error = new Error('Database error');

      mockSettingsService.getResolved.mockRejectedValue(error);

      await expect(controller.get(tenantId)).rejects.toThrow(error);
    });
  });

  describe('patch', () => {
    const tenantId = 'tenant-123';
    const apiKey: ApiKeyInfo = {
      keyId: 'key-456',
      scopes: [SCOPE_MANAGE_SETTINGS],
      permissions: [],
      environment: 'production',
      tenantId,
    };

    it('should update settings and return result', async () => {
      const updates = {
        brand_display_name: 'Updated Brand',
        duplicate_window_minutes: 10,
      };
      const body = { updates };
      const mockResult = { 
        brand_display_name: 'Updated Brand',
        duplicate_window_minutes: 10,
        theme_primary_color: '#000000' 
      };

      mockSettingsService.update.mockResolvedValue(mockResult);

      const result = await controller.patch(tenantId, apiKey, body);

      expect(result).toEqual({ settings: mockResult });
      expect(mockSettingsService.update).toHaveBeenCalledWith(tenantId, updates, apiKey.keyId);
    });

    it('should handle empty updates object', async () => {
      const body = {}; // No updates key
      const mockResult = { brand_display_name: 'Test Brand' };

      mockSettingsService.update.mockResolvedValue(mockResult);

      const result = await controller.patch(tenantId, apiKey, body);

      expect(result).toEqual({ settings: mockResult });
      expect(mockSettingsService.update).toHaveBeenCalledWith(tenantId, {}, apiKey.keyId);
    });

    it('should handle empty body.updates', async () => {
      const body = { updates: {} };
      const mockResult = { brand_display_name: 'Test Brand' };

      mockSettingsService.update.mockResolvedValue(mockResult);

      const result = await controller.patch(tenantId, apiKey, body);

      expect(result).toEqual({ settings: mockResult });
      expect(mockSettingsService.update).toHaveBeenCalledWith(tenantId, {}, apiKey.keyId);
    });

    it('should pass through service errors', async () => {
      const body = { updates: { invalid_key: 'value' } };
      const error = new Error('Invalid setting key');

      mockSettingsService.update.mockRejectedValue(error);

      await expect(controller.patch(tenantId, apiKey, body)).rejects.toThrow(error);
    });

    it('should use apiKey.keyId as actor for audit trail', async () => {
      const body = { updates: { brand_display_name: 'New Brand' } };
      const mockResult = { brand_display_name: 'New Brand' };

      mockSettingsService.update.mockResolvedValue(mockResult);

      await controller.patch(tenantId, apiKey, body);

      expect(mockSettingsService.update).toHaveBeenCalledWith(
        tenantId, 
        { brand_display_name: 'New Brand' }, 
        apiKey.keyId
      );
    });
  });
});
