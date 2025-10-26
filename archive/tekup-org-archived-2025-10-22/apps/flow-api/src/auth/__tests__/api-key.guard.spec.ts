import { ApiKeyGuard } from '../api-key.guard.js';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockReflector: Reflector;

  beforeEach(() => {
    mockReflector = new Reflector();
    guard = new ApiKeyGuard(mockReflector);
    
    mockRequest = {
      tenantId: undefined,
      apiKeyId: undefined,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should allow request when tenantId and apiKeyId are present', () => {
      mockRequest.tenantId = 'tenant-123';
      mockRequest.apiKeyId = 'key-456';

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when tenantId is missing', () => {
      mockRequest.apiKeyId = 'key-456';
      // tenantId is undefined

      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException({ error: 'missing_valid_api_key', message: 'Valid API key required for this endpoint' })
      );
    });

    it('should throw UnauthorizedException when apiKeyId is missing', () => {
      mockRequest.tenantId = 'tenant-123';
      // apiKeyId is undefined

      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException({ error: 'missing_valid_api_key', message: 'Valid API key required for this endpoint' })
      );
    });

    it('should throw UnauthorizedException when both tenantId and apiKeyId are missing', () => {
      // both undefined

      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException({ error: 'missing_valid_api_key', message: 'Valid API key required for this endpoint' })
      );
    });
  });
});
