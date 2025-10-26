import { VoiceIntegrationService } from '../voice-integration.service';
import { VoiceCommand } from '@tekup/shared';

// Mock the API client
jest.mock('@tekup/api-client', () => ({
  createApiClient: jest.fn(() => ({
    // Mock API client methods
  })),
}));

describe('VoiceIntegrationService', () => {
  const mockConfig = {
    flowApiUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
  };

  let service: VoiceIntegrationService;

  beforeEach(() => {
    service = new VoiceIntegrationService(mockConfig);
  });

  describe('Tenant Validation', () => {
    it('should allow access to assigned tenant', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = { tenantId: mockConfig.tenantId };

      // Mock the private method
      const mockExecuteCommand = jest.spyOn(service as any, 'executeCommandForTenant');
      mockExecuteCommand.mockResolvedValue({ leads: [] });

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(true);
      expect(result.tenant).toBe(mockConfig.tenantId);
      expect(mockExecuteCommand).toHaveBeenCalledWith(command, mockConfig.tenantId, parameters);
    });

    it('should deny access to unauthorized tenant', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = { tenantId: '999e4567-e89b-12d3-a456-426614174999' };

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });

    it('should deny access to invalid tenant ID format', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = { tenantId: 'invalid-tenant-id' };

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });

    it('should use default tenant when no tenant specified', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = {};

      const mockExecuteCommand = jest.spyOn(service as any, 'executeCommandForTenant');
      mockExecuteCommand.mockResolvedValue({ leads: [] });

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(true);
      expect(result.tenant).toBe(mockConfig.tenantId);
      expect(mockExecuteCommand).toHaveBeenCalledWith(command, mockConfig.tenantId, parameters);
    });
  });

  describe('Operation Permissions', () => {
    it('should allow permitted operations', async () => {
      const permittedOperations = [
        'create_lead',
        'get_leads',
        'search_leads',
        'get_metrics',
        'start_backup',
        'compliance_check'
      ];

      for (const operation of permittedOperations) {
        const command: VoiceCommand = { name: operation };
        const parameters = { tenantId: mockConfig.tenantId };

        const mockExecuteCommand = jest.spyOn(service as any, 'executeCommandForTenant');
        mockExecuteCommand.mockResolvedValue({ result: 'success' });

        const result = await service.executeVoiceCommand(command, parameters);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should deny unpermitted operations', async () => {
      const command: VoiceCommand = { name: 'unauthorized_operation' };
      const parameters = { tenantId: mockConfig.tenantId };

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = { tenantId: mockConfig.tenantId };

      const mockExecuteCommand = jest.spyOn(service as any, 'executeCommandForTenant');
      mockExecuteCommand.mockRejectedValue(new Error('API Error'));

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(result.tenant).toBe(mockConfig.tenantId); // Fallback to assigned tenant
    });

    it('should handle unknown errors', async () => {
      const command: VoiceCommand = { name: 'get_leads' };
      const parameters = { tenantId: mockConfig.tenantId };

      const mockExecuteCommand = jest.spyOn(service as any, 'executeCommandForTenant');
      mockExecuteCommand.mockRejectedValue('Unknown Error');

      const result = await service.executeVoiceCommand(command, parameters);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Security Features', () => {
    it('should not expose internal tenant permissions', () => {
      // The allowedTenants set should be private and not accessible
      expect((service as any).allowedTenants).toBeDefined();
      expect(typeof (service as any).allowedTenants).toBe('object');
      
      // Should not be enumerable or accessible from outside
      const keys = Object.keys(service);
      expect(keys).not.toContain('allowedTenants');
    });

    it('should validate tenant ID format strictly', () => {
      const validTenantIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff'
      ];

      const invalidTenantIds = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // Too short
        '123e4567-e89b-12d3-a456-4266141740000', // Too long
        '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
        ''
      ];

      validTenantIds.forEach(tenantId => {
        const command: VoiceCommand = { name: 'get_leads' };
        const parameters = { tenantId };
        
        expect(async () => {
          await service.executeVoiceCommand(command, parameters);
        }).not.toThrow();
      });

      invalidTenantIds.forEach(tenantId => {
        const command: VoiceCommand = { name: 'get_leads' };
        const parameters = { tenantId };
        
        expect(async () => {
          await service.executeVoiceCommand(command, parameters);
        }).rejects.toThrow();
      });
    });
  });
});